import fs from "node:fs/promises";
import path from "node:path";
import mysql from "mysql2/promise";
import type { ExtractedDocument } from "./extract.js";
import type { SectionDiff } from "./diff.js";

export type BulaKind = "vp" | "vps";
export type StoredVersion = {
  registrationNumber: string; idProduto: number; type: BulaKind;
  expediente: string; publicationDate: string; sha256: string;
  documents: ExtractedDocument[]; extractionMethod: string;
};
export type Comparison = {
  registrationNumber: string; idProduto: number; productName: string; holder: string;
  type: BulaKind; previous: { expediente: string; publicationDate: string; sha256: string };
  current: { expediente: string; publicationDate: string; sha256: string };
  summary: { changedSections: number; addedWords: number; removedWords: number; similarity: number };
  sections: SectionDiff[]; createdAt: string; cached: boolean;
  /** True only when the last saved comparison is shown without a successful fresh history check. */
  stale?: boolean;
};
const ROOT = path.join(process.cwd(), "data", "bula-diffs");
let pool: mysql.Pool | undefined;
let initialized = false;

async function database() {
  if (!process.env.DATABASE_URL) {
    if (process.env.VERCEL) throw new Error("Persistência não configurada: configure DATABASE_URL antes de habilitar comparações na Vercel.");
    return null;
  }
  pool ??= mysql.createPool(process.env.DATABASE_URL);
  if (!initialized) {
    await pool.query(`CREATE TABLE IF NOT EXISTS dbulario_bula_versions (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, registro VARCHAR(30) NOT NULL, tipo VARCHAR(3) NOT NULL,
      sha CHAR(64) NOT NULL, json LONGTEXT NOT NULL,
      UNIQUE KEY uniq_version (registro,tipo,sha)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS dbulario_bula_comparisons (
      id BIGINT AUTO_INCREMENT PRIMARY KEY, registro VARCHAR(30) NOT NULL, tipo VARCHAR(3) NOT NULL,
      previous_sha CHAR(64) NOT NULL, current_sha CHAR(64) NOT NULL, json LONGTEXT NOT NULL,
      UNIQUE KEY uniq_diff (registro,tipo,previous_sha,current_sha)
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS dbulario_bula_snapshots (
      registro VARCHAR(30) NOT NULL, tipo VARCHAR(3) NOT NULL,
      fingerprint CHAR(64) NOT NULL, json LONGTEXT NOT NULL,
      PRIMARY KEY (registro,tipo)
    )`);
    initialized = true;
  }
  return pool;
}
function safe(reg: string) {
  if (!/^\d{9,20}$/.test(reg)) throw new Error("Registro inválido para armazenamento.");
  return reg;
}
const file = (...segments: string[]) => path.join(ROOT, ...segments);
async function readJson<T>(location: string): Promise<T | null> {
  try { return JSON.parse(await fs.readFile(location, "utf8")) as T; }
  catch (err: any) { if (err.code === "ENOENT") return null; throw err; }
}
async function writeJson(location: string, value: unknown) {
  await fs.mkdir(path.dirname(location), { recursive: true });
  const temp = `${location}.${process.pid}.tmp`;
  await fs.writeFile(temp, JSON.stringify(value), "utf8");
  await fs.rename(temp, location);
}
export async function getVersion(reg: string, kind: BulaKind, sha: string): Promise<StoredVersion | null> {
  const db = await database();
  if (db) {
    const [rows] = await db.query<mysql.RowDataPacket[]>("SELECT json FROM dbulario_bula_versions WHERE registro=? AND tipo=? AND sha=?", [reg, kind, sha]);
    return rows.length ? JSON.parse(rows[0].json) as StoredVersion : null;
  }
  return readJson(file("versions", safe(reg), kind, `${sha}.json`));
}
export async function saveVersion(value: StoredVersion) {
  const db = await database();
  if (db) {
    await db.execute("INSERT INTO dbulario_bula_versions (registro,tipo,sha,json) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE json=VALUES(json)", [value.registrationNumber, value.type, value.sha256, JSON.stringify(value)]);
    return;
  }
  await writeJson(file("versions", safe(value.registrationNumber), value.type, `${value.sha256}.json`), value);
}
export async function getComparison(reg: string, kind: BulaKind, previous: string, current: string): Promise<Comparison | null> {
  const db = await database();
  if (db) {
    const [rows] = await db.query<mysql.RowDataPacket[]>("SELECT json FROM dbulario_bula_comparisons WHERE registro=? AND tipo=? AND previous_sha=? AND current_sha=?", [reg, kind, previous, current]);
    return rows.length ? { ...(JSON.parse(rows[0].json) as Comparison), cached: true, stale: false } : null;
  }
  const value = await readJson<Comparison>(file("comparisons", safe(reg), kind, `${previous}__${current}.json`));
  return value ? { ...value, cached: true, stale: false } : null;
}
export async function saveComparison(value: Comparison) {
  const db = await database();
  if (db) {
    await db.execute("INSERT INTO dbulario_bula_comparisons (registro,tipo,previous_sha,current_sha,json) VALUES (?,?,?,?,?) ON DUPLICATE KEY UPDATE json=VALUES(json)", [value.registrationNumber, value.type, value.previous.sha256, value.current.sha256, JSON.stringify(value)]);
    return;
  }
  await writeJson(file("comparisons", safe(value.registrationNumber), value.type, `${value.previous.sha256}__${value.current.sha256}.json`), value);
}
/** With fingerprint="", return the most recent saved result, explicitly flagged as unverified. */
export async function getSnapshot(reg: string, kind: BulaKind, fingerprint: string): Promise<Comparison | null> {
  const db = await database();
  if (db) {
    const sql = fingerprint
      ? "SELECT json FROM dbulario_bula_snapshots WHERE registro=? AND tipo=? AND fingerprint=?"
      : "SELECT json FROM dbulario_bula_snapshots WHERE registro=? AND tipo=?";
    const params = fingerprint ? [reg, kind, fingerprint] : [reg, kind];
    const [rows] = await db.query<mysql.RowDataPacket[]>(sql, params);
    return rows.length ? { ...(JSON.parse(rows[0].json) as Comparison), cached: true, stale: !fingerprint } : null;
  }
  const value = await readJson<{ fingerprint: string; comparison: Comparison }>(file("snapshots", `${safe(reg)}_${kind}.json`));
  return value && (!fingerprint || value.fingerprint === fingerprint)
    ? { ...value.comparison, cached: true, stale: !fingerprint }
    : null;
}
export async function saveSnapshot(reg: string, kind: BulaKind, fingerprint: string, comparison: Comparison) {
  const db = await database();
  if (db) {
    await db.execute("INSERT INTO dbulario_bula_snapshots (registro,tipo,fingerprint,json) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE fingerprint=VALUES(fingerprint),json=VALUES(json)", [reg, kind, fingerprint, JSON.stringify(comparison)]);
    return;
  }
  await writeJson(file("snapshots", `${safe(reg)}_${kind}.json`), { fingerprint, comparison });
}
