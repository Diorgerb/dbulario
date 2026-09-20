import "dotenv/config";
import { AnvisaAccessError, AnvisaBrowser } from "../server/lib/bula-diff/browser-anvisa.js";

const idProduto = Number(process.argv[2] ?? "1220881");
const registrationNumber = String(process.argv[3] ?? "117660036").replace(/\D/g, "");
if (!Number.isSafeInteger(idProduto) || idProduto <= 0 || !/^\d{9,20}$/.test(registrationNumber)) {
  console.error("Uso: npx tsx scripts/diagnose-bulario-anvisa.ts ID_PRODUTO NUMERO_REGISTRO");
  process.exit(2);
}

async function main() {
  console.log("Ambiente:", process.env.VERCEL ? "Vercel" : "local");
  console.log("Modo navegador:", process.env.ANVISA_HEADLESS === "false" ? "visível" : "sem interface");
  console.log("Etapa 1: abrir página de detalhe no navegador...");
  const api = new AnvisaBrowser();
  try {
    await api.open(idProduto, registrationNumber);
    console.log("Etapa 1 OK: navegador iniciou e abriu o portal.");
    console.log("Etapa 2: consultar histórico via fetch dentro da página...");
    const history = await api.history(idProduto);
    const entries = history?.historico?.content;
    if (!Array.isArray(entries)) throw new Error("Histórico sem lista de edições.");
    console.log("Etapa 2 OK: histórico retornou", entries.length, "edições nesta página.");
    const item = entries.find((entry: { idBulaPaciente?: string; idBulaProfissional?: string }) => entry.idBulaPaciente || entry.idBulaProfissional);
    const id = item?.idBulaPaciente || item?.idBulaProfissional;
    if (!id) {
      console.log("Etapa 3 não executada: não há identificador de PDF nas edições recebidas.");
      return;
    }
    console.log("Etapa 3: baixar um PDF via fetch dentro da página...");
    const pdf = await api.pdf(id);
    console.log("Etapa 3 OK: PDF válido, bytes:", pdf.length);
    console.log("Consulta via navegador: OK. O processamento de comparação deve ser investigado separadamente se ainda falhar.");
  } catch (error) {
    if (error instanceof AnvisaAccessError) {
      console.error("Falha identificada:", { etapa: error.stage, codigo: error.code, http: error.httpStatus ?? "não informado" });
      if (error.code === "BROWSER_UNAVAILABLE") console.error("Instale o navegador com: npx playwright install chromium");
      if (error.code === "ANVISA_ACCESS_DENIED") console.error("A sessão deste ambiente recebeu restrição da ANVISA. O modo navegador não assegura acesso.");
      if (error.code === "ANVISA_RATE_LIMITED") console.error("Limite de requisições observado; evite repetir consultas sucessivas.");
    } else {
      console.error("Falha fora da consulta HTTP:", error instanceof Error ? error.message : String(error));
    }
    process.exitCode = 1;
  } finally {
    await api.close();
  }
}
void main();
