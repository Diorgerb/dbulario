import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const CSV_FILENAME = "StatusBulasANVISA.csv";

const currentFilePath = fileURLToPath(import.meta.url);
const currentDirPath = path.dirname(currentFilePath);

const MAIN_CSV_CANDIDATES = [
  process.env.CSV_PATH,
  path.join(process.cwd(), "data", CSV_FILENAME),
  path.join(currentDirPath, "../../data", CSV_FILENAME),
  path.join("/var/task/data", CSV_FILENAME),
].filter((value): value is string => Boolean(value));

const DATA_DIR_CANDIDATES = [
  process.env.CSV_PATH,
  path.join(process.cwd(), "data"),
  path.join(currentDirPath, "../../data"),
  "/var/task/data",
].filter((value): value is string => Boolean(value));

function normalizeRegistrationNumber(value: string | null | undefined) {
  return (value || "").replace(/\D/g, "");
}


function extractDateOnly(value: string | null | undefined) {
  if (!value) return null;

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;
  return `${year}-${month}-${day}`;
}

function parseDate(value: string | null | undefined) {
  const dateOnly = extractDateOnly(value);

  if (!dateOnly) {
    return null;
  }

  const date = new Date(`${dateOnly}T12:00:00.000Z`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getDateStringDaysAgo(days: number) {
  const base = startOfToday();
  base.setDate(base.getDate() - days);

  const year = base.getFullYear();
  const month = String(base.getMonth() + 1).padStart(2, "0");
  const day = String(base.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function isReadableFile(filePath: string) {
  try {
    const stats = fs.statSync(filePath);

    if (!stats.isFile()) {
      return false;
    }

    fs.accessSync(filePath, fs.constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

function resolveCSVPath() {
  const csvPath = MAIN_CSV_CANDIDATES.find((candidatePath) =>
    isReadableFile(candidatePath)
  );

  if (!csvPath) {
    console.error("[CSV] File not found in any known path", {
      candidates: MAIN_CSV_CANDIDATES,
      cwd: process.cwd(),
    });
    return null;
  }

  return csvPath;
}

function resolveDataDir() {
  for (const candidate of DATA_DIR_CANDIDATES) {
    try {
      const stats = fs.statSync(candidate);

      if (stats.isDirectory()) {
        return candidate;
      }

      if (stats.isFile()) {
        return path.dirname(candidate);
      }
    } catch {
      continue;
    }
  }

  return null;
}

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
      record[h] = (values[idx] || "").replace(/^"|"$/g, "").trim();
    });

    records.push(record);
  }

  return records;
}

/* -------------------- NORMALIZAÇÃO -------------------- */
function normalizeMedication(row: any) {
  if (!row.numeroRegistro || !row.nomeProduto) return null;

  const publicationDateText = extractDateOnly(row.data);
  const lastUpdateText = extractDateOnly(row.dataAtualizacao);
  const publicationDate = parseDate(row.data);
  const lastUpdate = parseDate(row.dataAtualizacao);

  return {
    id: Number(row.idProduto),
    registrationNumber: row.numeroRegistro,
    normalizedRegistrationNumber: normalizeRegistrationNumber(row.numeroRegistro),
    name: row.nomeProduto,
    holder: row.razaoSocial || null,
    cnpj: row.cnpj || null,
    expediente: row.expediente || null,
    processNumber: row.numProcesso || null,
    publicationDate,
    lastUpdate,
    publicationDateText,
    lastUpdateText,
    category: "medicamento",
    status: "ativo",
  };
}

/* -------------------- CACHE -------------------- */
let CACHE: any[] | null = null;
const CATEGORY_REGISTRATION_CACHE = new Map<string, Set<string>>();

function loadCSV() {
  if (CACHE) return CACHE;

  const csvPath = resolveCSVPath();

  if (!csvPath) {
    return [];
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const parsed = parseCSV(content);

  CACHE = parsed.map(normalizeMedication).filter(Boolean);

  console.log(`[CSV] Loaded ${CACHE.length} medications from CSV (${csvPath})`);

  return CACHE;
}

function sanitizeCategoryName(category: string) {
  return category.trim().replace(/\.csv$/i, "");
}

export function getFilterCategories() {
  const dataDir = resolveDataDir();

  if (!dataDir) {
    return [];
  }

  return fs
    .readdirSync(dataDir)
    .filter((fileName) => fileName.toLowerCase().endsWith(".csv"))
        .filter((fileName) => fileName.toLowerCase() !== CSV_FILENAME.toLowerCase())
    .map((fileName) => fileName.replace(/\.csv$/i, ""))
    .sort((a, b) => a.localeCompare(b, "pt-BR"));
}

export function getCategoryRegistrationSet(category: string) {
  const normalizedCategory = sanitizeCategoryName(category);

  if (!normalizedCategory) {
    return new Set<string>();
  }

  if (CATEGORY_REGISTRATION_CACHE.has(normalizedCategory)) {
    return CATEGORY_REGISTRATION_CACHE.get(normalizedCategory)!;
  }

  const dataDir = resolveDataDir();

  if (!dataDir) {
    CATEGORY_REGISTRATION_CACHE.set(normalizedCategory, new Set<string>());
    return CATEGORY_REGISTRATION_CACHE.get(normalizedCategory)!;
  }

  const csvPath = path.join(dataDir, `${normalizedCategory}.csv`);

  if (!isReadableFile(csvPath)) {
    CATEGORY_REGISTRATION_CACHE.set(normalizedCategory, new Set<string>());
    return CATEGORY_REGISTRATION_CACHE.get(normalizedCategory)!;
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const parsed = parseCSV(content);
  const registrations = new Set<string>();

  for (const row of parsed) {
    const firstValue = Object.values(row)[0];

    if (typeof firstValue !== "string") {
      continue;
    }

    const normalizedRegistration = normalizeRegistrationNumber(firstValue);

    if (normalizedRegistration) {
      registrations.add(normalizedRegistration);
    }
  }

  CATEGORY_REGISTRATION_CACHE.set(normalizedCategory, registrations);
  return registrations;
}

/* -------------------- LISTAGEM -------------------- */
function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

export function listMedications(
  page = 1,
  limit = 10,
  filters: {
    search?: string;
    numeroRegistro?: string;
    razaoSocial?: string;
    cnpj?: string;
    category?: string;
    status?: string;
    dateRange?: number;
  } = {}
) {
  const data = loadCSV();
  let result = [...data];

  if (filters.search) {
    const q = filters.search.toLowerCase();

    result = result.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.registrationNumber.includes(q) ||
        (m.holder && m.holder.toLowerCase().includes(q))
    );
  }

  if (filters.numeroRegistro) {
    result = result.filter((m) =>
      m.registrationNumber.includes(filters.numeroRegistro!)
    );
  }

  if (filters.razaoSocial) {
    const q = filters.razaoSocial.toLowerCase();

    result = result.filter((m) => m.holder && m.holder.toLowerCase().includes(q));
  }

  if (filters.cnpj) {
    result = result.filter((m) => m.cnpj && m.cnpj.includes(filters.cnpj!));
  }

  if (filters.category) {
    const categorySet = getCategoryRegistrationSet(filters.category);
    result = result.filter((m) => categorySet.has(m.normalizedRegistrationNumber));
  }

  if (filters.status) {
    result = result.filter((m) => m.status === filters.status);
  }

  if (filters.dateRange !== undefined) {
    const sinceDate = getDateStringDaysAgo(filters.dateRange);

    result = result.filter(
      (m) => m.publicationDateText && m.publicationDateText >= sinceDate
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
    publicationDate: m.publicationDateText ?? null,
    lastUpdate: m.lastUpdateText ?? null,
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
export function searchMedications(query: string, opts?: { limit?: number }) {
  const data = loadCSV();
  const q = query.toLowerCase();

  return data
    .filter((m) => m.name.toLowerCase().includes(q) || m.registrationNumber.includes(q))
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
  const last7 = getDateStringDaysAgo(7);
  const last30 = getDateStringDaysAgo(30);
  const last90 = getDateStringDaysAgo(90);

  return {
    total: data.length,
    updatedLast7Days: data.filter((m) => m.publicationDateText && m.publicationDateText >= last7).length,
    updatedLast30Days: data.filter((m) => m.publicationDateText && m.publicationDateText >= last30).length,
    updatedLast90Days: data.filter((m) => m.publicationDateText && m.publicationDateText >= last90).length,
  };
}

/* -------------------- ATUALIZAÇÕES RECENTES -------------------- */
export function getRecentUpdates(days = 7) {
  const data = loadCSV();
  const sinceDate = getDateStringDaysAgo(days);

  return data
    .filter((m) => m.publicationDateText && m.publicationDateText >= sinceDate)
    .sort((a, b) => (b.publicationDateText || "").localeCompare(a.publicationDateText || ""))
    .slice(0, 50);
}
