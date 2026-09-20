import { chromium, type Browser, type Page } from "playwright";

const ORIGIN = "https://consultas.anvisa.gov.br";
const API = `${ORIGIN}/api/consulta`;
const PAUSE_MS = 1100;
const MAX_PDF_BYTES = 25 * 1024 * 1024;
type BrowserResult = { status: number; data: string; contentType: string };
export type AnvisaErrorCode = "BROWSER_UNAVAILABLE" | "ANVISA_NAVIGATION_FAILED" | "ANVISA_ACCESS_DENIED" | "ANVISA_RATE_LIMITED" | "ANVISA_PORTAL_UNAVAILABLE" | "ANVISA_HTTP_ERROR" | "ANVISA_FETCH_FAILED" | "ANVISA_INVALID_RESPONSE" | "ANVISA_INVALID_PDF";

/** Classified errors allow the API to log the real cause without leaking temporary PDF tokens. */
export class AnvisaAccessError extends Error {
  constructor(public readonly code: AnvisaErrorCode, public readonly stage: "browser" | "navigation" | "history" | "pdf", message: string, public readonly httpStatus?: number) {
    super(`${code}: ${message}`);
    this.name = "AnvisaAccessError";
  }
}
function httpError(status: number, stage: "history" | "pdf") {
  const code: AnvisaErrorCode = status === 401 || status === 403 ? "ANVISA_ACCESS_DENIED" : status === 429 ? "ANVISA_RATE_LIMITED" : status >= 500 ? "ANVISA_PORTAL_UNAVAILABLE" : "ANVISA_HTTP_ERROR";
  return new AnvisaAccessError(code, stage, `HTTP ${status} recebido da ANVISA na etapa ${stage}.`, status);
}

export class AnvisaBrowser {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private previousRequest = 0;

  async open(idProduto?: number, registrationNumber?: string) {
    try {
      this.browser = await chromium.launch({
        headless: process.env.ANVISA_HEADLESS !== "false",
        ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
        ...(process.env.ANVISA_BROWSER_CHANNEL ? { channel: process.env.ANVISA_BROWSER_CHANNEL as "chrome" | "msedge" | "chromium" } : {}),
      });
    } catch (cause) {
      console.error("[BULA_DIFF] chromium_launch_failed", { environment: process.env.VERCEL ? "vercel" : "local", reason: cause instanceof Error ? cause.message.slice(0, 450) : String(cause).slice(0, 450) });
      throw new AnvisaAccessError("BROWSER_UNAVAILABLE", "browser", "Chromium não está instalado ou não pode iniciar no ambiente do servidor.");
    }
    const context = await this.browser.newContext({ acceptDownloads: false });
    this.page = await context.newPage();
    const hasId = Number.isSafeInteger(idProduto) && (idProduto ?? 0) > 0;
    const hasRegistration = !!registrationNumber && /^\d{9,20}$/.test(registrationNumber);
    const target = hasId && hasRegistration ? `${ORIGIN}/#/bulario/detalhe/${idProduto}?numeroRegistro=${encodeURIComponent(registrationNumber!)}` : `${ORIGIN}/#/bulario/q/`;
    try {
      const response = await this.page.goto(target, { waitUntil: "domcontentloaded", timeout: 60000 });
      if (new URL(this.page.url()).origin !== ORIGIN) throw new AnvisaAccessError("ANVISA_NAVIGATION_FAILED", "navigation", "O portal redirecionou para outro site.");
      if (response?.status() === 401 || response?.status() === 403) throw new AnvisaAccessError("ANVISA_ACCESS_DENIED", "navigation", `HTTP ${response.status()} ao abrir o portal.`, response.status());
      if (response && response.status() >= 500) throw new AnvisaAccessError("ANVISA_PORTAL_UNAVAILABLE", "navigation", `HTTP ${response.status()} ao abrir o portal.`, response.status());
      const title = await this.page.title();
      if (/just a moment|access denied|attention required|acesso negado/i.test(title)) throw new AnvisaAccessError("ANVISA_ACCESS_DENIED", "navigation", "O portal apresentou uma página de restrição de acesso.");
    } catch (cause) {
      if (cause instanceof AnvisaAccessError) throw cause;
      console.error("[BULA_DIFF] portal_navigation_failed", { reason: cause instanceof Error ? cause.message.slice(0, 450) : String(cause).slice(0, 450) });
      throw new AnvisaAccessError("ANVISA_NAVIGATION_FAILED", "navigation", "Não foi possível abrir o portal no navegador automatizado.");
    }
  }

  private async request(path: string, binary: boolean): Promise<Buffer | unknown> {
    if (!this.page) throw new AnvisaAccessError("BROWSER_UNAVAILABLE", "browser", "O navegador não foi inicializado.");
    const stage = binary ? "pdf" : "history";
    const wait = PAUSE_MS - (Date.now() - this.previousRequest);
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    this.previousRequest = Date.now();
    const url = `${API}/${path}`;
    let response: BrowserResult;
    try {
      response = await this.page.evaluate(async ({ url, binary, maxBytes }): Promise<BrowserResult> => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 50000);
        try {
          const result = await fetch(url, { headers: { Authorization: "Guest", Accept: binary ? "application/pdf,application/octet-stream,*/*" : "application/json, text/plain, */*" }, credentials: "same-origin", signal: controller.signal });
          const contentType = result.headers.get("content-type") ?? "";
          if (!result.ok) return { status: result.status, data: "", contentType };
          if (!binary) return { status: result.status, data: await result.text(), contentType };
          const declaredSize = Number(result.headers.get("content-length") ?? 0);
          if (declaredSize > maxBytes) throw new Error("PDF_TOO_LARGE");
          const raw = await result.arrayBuffer();
          if (raw.byteLength > maxBytes) throw new Error("PDF_TOO_LARGE");
          const bytes = new Uint8Array(raw);
          let text = "";
          for (let index = 0; index < bytes.length; index += 32768) text += String.fromCharCode(...bytes.subarray(index, index + 32768));
          return { status: result.status, data: btoa(text), contentType };
        } finally { clearTimeout(timeout); }
      }, { url, binary, maxBytes: MAX_PDF_BYTES });
    } catch (cause) {
      console.error("[BULA_DIFF] browser_fetch_failed", { stage, reason: cause instanceof Error ? cause.message.slice(0, 450) : String(cause).slice(0, 450) });
      throw new AnvisaAccessError("ANVISA_FETCH_FAILED", stage, "Falha de conexão ao consultar a ANVISA dentro da página do navegador.");
    }
    if (response.status !== 200) throw httpError(response.status, stage);
    if (!binary) {
      try {
        const data: unknown = JSON.parse(response.data);
        if (!data || typeof data !== "object" || !("historico" in data)) throw new Error("Histórico ausente");
        return data;
      } catch {
        console.error("[BULA_DIFF] history_invalid_response", { contentType: response.contentType });
        throw new AnvisaAccessError("ANVISA_INVALID_RESPONSE", "history", "A resposta não contém o histórico esperado. Pode ser uma página de bloqueio ou uma alteração na API.");
      }
    }
    const buffer = Buffer.from(response.data, "base64");
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      console.error("[BULA_DIFF] pdf_invalid_response", { contentType: response.contentType });
      throw new AnvisaAccessError("ANVISA_INVALID_PDF", "pdf", "O download não retornou um PDF válido.");
    }
    return buffer;
  }
  async history(idProduto: number): Promise<any> {
    if (!Number.isSafeInteger(idProduto) || idProduto <= 0) throw new Error("idProduto inválido.");
    return this.request(`bulario/${idProduto}?count=100&page=1`, false);
  }
  async pdf(idBula: string): Promise<Buffer> {
    if (!/^[A-Za-z0-9._-]+$/.test(idBula)) throw new Error("Identificador de bula inválido.");
    return this.request(`medicamentos/arquivo/bula/parecer/${encodeURIComponent(idBula)}/?Authorization=`, true) as Promise<Buffer>;
  }
  async close() {
    await this.browser?.close();
    this.browser = null;
    this.page = null;
  }
}
