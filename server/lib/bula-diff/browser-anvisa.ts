import { chromium, type Browser, type Page } from "playwright";

const ORIGIN = "https://consultas.anvisa.gov.br";
const API = `${ORIGIN}/api/consulta`;
const PAUSE_MS = 1100;
const MAX_PDF_BYTES = 25 * 1024 * 1024;

type BrowserResult = { status: number; data: string; binary: boolean; contentType: string };

export class AnvisaBrowser {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private previousRequest = 0;

  async open() {
    try {
      this.browser = await chromium.launch({
        headless: process.env.ANVISA_HEADLESS !== "false",
        ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
      });
    } catch (cause) {
      throw new Error("Não foi possível abrir o Chromium. Execute 'npx playwright install chromium' no VS Code. Em produção, configure um worker com Chromium; a função Vercel não dispõe automaticamente desse navegador.", { cause });
    }
    const context = await this.browser.newContext({ acceptDownloads: false });
    this.page = await context.newPage();
    await this.page.goto(`${ORIGIN}/#/bulario/q/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (new URL(this.page.url()).origin !== ORIGIN) {
      throw new Error("O navegador não abriu na origem da ANVISA. Confira a rede e a disponibilidade do portal.");
    }
  }

  private async request(path: string, binary: boolean): Promise<Buffer | unknown> {
    if (!this.page) throw new Error("Inicialize a sessão ANVISA antes da consulta.");
    const wait = PAUSE_MS - (Date.now() - this.previousRequest);
    if (wait > 0) await new Promise(resolve => setTimeout(resolve, wait));
    this.previousRequest = Date.now();
    const url = `${API}/${path}`;
    const response = await this.page.evaluate(async ({ url, binary, maxBytes }): Promise<BrowserResult> => {
      const result = await fetch(url, {
        headers: { Authorization: "Guest", Accept: binary ? "application/pdf,application/octet-stream,*/*" : "application/json, text/plain, */*" },
        credentials: "same-origin",
      });
      const contentType = result.headers.get("content-type") ?? "";
      if (!result.ok) return { status: result.status, data: (await result.text()).slice(0, 250), binary, contentType };
      if (!binary) return { status: result.status, data: await result.text(), binary, contentType };
      const raw = await result.arrayBuffer();
      if (raw.byteLength > maxBytes) throw new Error("PDF da ANVISA excedeu o limite configurado de 25 MB.");
      const bytes = new Uint8Array(raw);
      let text = "";
      for (let index = 0; index < bytes.length; index += 32768) {
        text += String.fromCharCode(...bytes.subarray(index, index + 32768));
      }
      return { status: result.status, data: btoa(text), binary, contentType };
    }, { url, binary, maxBytes: MAX_PDF_BYTES });
    if (response.status !== 200) {
      throw new Error(`ANVISA retornou HTTP ${response.status} dentro do navegador. ${response.status === 403 ? "Bloqueio da sessão/Cloudflare; confirme o acesso à página no Chromium." : response.data}`);
    }
    if (!binary) {
      try { return JSON.parse(response.data); }
      catch { throw new Error("O histórico da ANVISA não retornou JSON (possível página de bloqueio)."); }
    }
    const buffer = Buffer.from(response.data, "base64");
    if (buffer.subarray(0, 5).toString("latin1") !== "%PDF-") {
      throw new Error("O arquivo retornado não é PDF; a sessão da ANVISA pode ter expirado.");
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
