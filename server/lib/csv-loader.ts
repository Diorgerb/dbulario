import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CSV_PATH = path.join(__dirname, "../../data/StatusBulasANVISA.csv");

/* -------------------- CSV PARSER -------------------- */
function parseCSV(content: string) {
  const lines = content.split(/\r?\n/);
  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));

  const records: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i]?.trim()) continue;

    const values: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let j = 0; j < lines[i].length; j++) {
      const char = lines[i][j];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);

    const record: any = {};
    headers.forEach((h, idx) => {
      record[h] = (values[idx] || "")
        .replace(/^"|"$/g, "")
        .trim();
    });

    records.push(record);
  }

  return records;
}

/* -------------------- NORMALIZAÇÃO -------------------- */
function normalizeMedication(row: any) {
  if (!row.numeroRegistro || !row.nomeProduto) return null;

  const publicationDate = row.data ? new Date(row.data) : null;
  const lastUpdate = row.dataAtualizacao ? new Date(row.dataAtualizacao) : null;

  return {
    id: Number(row.idProduto),
    registrationNumber: row.numeroRegistro,
    name: row.nomeProduto,
    holder: row.razaoSocial || null,
    cnpj: row.cnpj || null,
    expediente: row.expediente || null,
    processNumber: row.numProcesso || null,
    publicationDate, // atualização do bulário
    lastUpdate,      // inclusão na plataforma
    category: "medicamento",
    status: "ativo",
  };
}

/* -------------------- CACHE -------------------- */
let CACHE: any[] | null = null;

function loadCSV() {
  if (CACHE) return CACHE;

  if (!fs.existsSync(CSV_PATH)) {
    console.error("[CSV] File not found:", CSV_PATH);
    return [];
  }

  const content = fs.readFileSync(CSV_PATH, "utf8");
  const parsed = parseCSV(content);

  CACHE = parsed.map(normalizeMedication).filter(Boolean);
  console.log(`[CSV] Loaded ${CACHE.length} medications from CSV`);

  return CACHE;
}

/* -------------------- LISTAGEM -------------------- */
export function listMedications(
  page = 1,
  limit = 10,
  filters: {
    search?: string;
    category?: string;
    status?: string;
    dateRange?: number; // filtro pela atualização do bulário
  } = {}
) {
  const data = loadCSV();
  let result = [...data];

  // Busca textual
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.registrationNumber.includes(q) ||
        (m.holder && m.holder.toLowerCase().includes(q))
    );
  }

  // Filtro por categoria
  if (filters.category) {
    result = result.filter(
      (m) => m.category === filters.category
    );
  }

  // Filtro por status
  if (filters.status) {
    result = result.filter(
      (m) => m.status === filters.status
    );
  }

  // Filtro por data de atualização do bulário
  if (filters.dateRange !== undefined) {
    const since = new Date();
    since.setDate(since.getDate() - filters.dateRange);
    result = result.filter(
      (m) => m.publicationDate && m.publicationDate >= since
    );
  }

  const total = result.length;
  const start = (page - 1) * limit;

  const items = result.slice(start, start + limit).map((m) => ({
    id: m.id,
    name: m.name,
    registrationNumber: m.registrationNumber,
    holder: m.holder ?? "-",
    cnpj: m.cnpj ?? "-",
    processNumber: m.processNumber ?? "-",
    publicationDate: m.publicationDate
      ? m.publicationDate.toISOString()
      : null,
    lastUpdate: m.lastUpdate
      ? m.lastUpdate.toISOString()
      : null,
    category: m.category,
    status: m.status,
  }));

  return {
    items,
    total,
    page,
    limit,
    totalPages: Math.max(1, Math.ceil(total / limit)),
  };
}

/* -------------------- BUSCA RÁPIDA -------------------- */
export function searchMedications(
  query: string,
  opts?: { limit?: number }
) {
  const data = loadCSV();
  const q = query.toLowerCase();

  return data
    .filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.registrationNumber.includes(q)
    )
    .slice(0, opts?.limit || 10);
}

/* -------------------- DETALHE POR ID -------------------- */
export function getMedicationById(id: number) {
  const data = loadCSV();
  return data.find((m) => m.id === id) || null;
}

/* -------------------- ESTATÍSTICAS -------------------- */
export function getMedicationStats() {
  const data = loadCSV();
  const now = new Date();

  const last7 = new Date();
  last7.setDate(now.getDate() - 7);

  const last30 = new Date();
  last30.setDate(now.getDate() - 30);

  const last90 = new Date();
  last90.setDate(now.getDate() - 90);

  return {
    total: data.length,
    updatedLast7Days: data.filter(
      (m) => m.publicationDate && m.publicationDate >= last7
    ).length,
    updatedLast30Days: data.filter(
      (m) => m.publicationDate && m.publicationDate >= last30
    ).length,
    updatedLast90Days: data.filter(
      (m) => m.publicationDate && m.publicationDate >= last90
    ).length,
  };
}

/* -------------------- ATUALIZAÇÕES RECENTES -------------------- */
export function getRecentUpdates(days = 7) {
  const data = loadCSV();
  const since = new Date();
  since.setDate(since.getDate() - days);

  return data
    .filter((m) => m.publicationDate && m.publicationDate >= since)
    .sort(
      (a, b) =>
        b.publicationDate.getTime() - a.publicationDate.getTime()
    )
    .slice(0, 50);
}
