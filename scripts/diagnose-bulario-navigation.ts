import "dotenv/config";
import { chromium } from "playwright";

const ORIGIN = "https://consultas.anvisa.gov.br";
const id = Number(process.argv[2] ?? "1220881");
const registration = (process.argv[3] ?? "117660036").replace(/\D/g, "");
if (!Number.isSafeInteger(id) || id <= 0 || !/^\d{9,20}$/.test(registration)) {
  console.error("Uso: npx tsx scripts/diagnose-bulario-navigation.ts ID_PRODUTO REGISTRO");
  process.exit(2);
}
const detail = `${ORIGIN}/#/bulario/detalhe/${id}?numeroRegistro=${encodeURIComponent(registration)}`;

async function main() {
  const browser = await chromium.launch({
    headless: process.env.ANVISA_HEADLESS !== "false",
    ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {}),
    ...(process.env.ANVISA_BROWSER_CHANNEL ? { channel: process.env.ANVISA_BROWSER_CHANNEL as "chrome" | "msedge" | "chromium" } : {}),
  });
  try {
    const page = await browser.newPage();
    for (const [name, url] of [["Página inicial", `${ORIGIN}/`], ["Detalhe", detail]] as const) {
      console.log(`Verificando: ${name}`);
      const response = await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
      const headers = response?.headers() ?? {};
      const status = response?.status() ?? "sem resposta HTTP";
      console.log({ status, host: new URL(page.url()).host, server: headers["server"] ?? null,
        contentType: headers["content-type"] ?? null,
        cfMitigated: headers["cf-mitigated"] ?? null, cfRayPresent: Boolean(headers["cf-ray"]) });
      if (status === 403) {
        console.log("A navegação HTTP foi negada ANTES do fetch da API; não é falha no identificador do produto nem na extração do PDF.");
        if (name === "Página inicial") console.log("A página inicial também recebeu 403. Verifique o acesso normal em Chrome/Edge. Não há base para atribuir a falha ao link de detalhe.");
        else console.log("A página inicial abriu, mas a segunda navegação recebeu 403. Ambas acessam o mesmo caminho HTTP /; diferenças podem decorrer da sessão ou de restrições entre requisições.");
        process.exitCode = 1;
        break;
      }
      if (typeof status === "number" && status >= 400) {
        console.log("Falha HTTP na navegação; a consulta à API ainda não foi executada.");
        process.exitCode = 1;
        break;
      }
      if (name === "Página inicial") await page.waitForTimeout(1000);
    }
    console.log("Nota: o fragmento #/bulario/detalhe/... não é enviado na requisição HTTP, apenas interpretado pela aplicação web.");
    console.log(`Teste também no seu navegador habitual: ${detail}`);
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error("Erro ao executar diagnóstico:", error instanceof Error ? error.message : String(error)); process.exitCode = 1; });
