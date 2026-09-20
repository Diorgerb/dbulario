import crypto from "node:crypto";
import { AnvisaBrowser, AnvisaAccessError } from "./browser-anvisa.js";
import { extractDocuments } from "./extract.js";
import { compareDocuments } from "./diff.js";
import { getComparison, getSnapshot, getVersion, saveComparison, saveSnapshot, saveVersion, type BulaKind, type Comparison, type StoredVersion } from "./cache.js";

type HistoryItem = {
  idDocumento?: string | number; expediente?: string; dataPublicacao?: string;
  idBulaPaciente?: string | null; idBulaProfissional?: string | null;
};
const sha256 = (value: Buffer | string) => crypto.createHash("sha256").update(value).digest("hex");
const versionId = (item: HistoryItem, type: BulaKind) => type === "vp" ? item.idBulaPaciente : item.idBulaProfissional;
const dateKey = (value?: string) => {
  if (!value) return 0;
  const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return Number(`${match[3]}${match[2]}${match[1]}`);
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  return iso ? Number(`${iso[1]}${iso[2]}${iso[3]}`) : 0;
};
function availableVersions(data: any, type: BulaKind): HistoryItem[] {
  const content: HistoryItem[] = Array.isArray(data?.historico?.content) ? data.historico.content : [];
  return content.map((item, index) => ({ item, index }))
    .sort((a, b) => dateKey(b.item.dataPublicacao) - dateKey(a.item.dataPublicacao) || a.index - b.index)
    .map(entry => entry.item).filter(item => !!versionId(item, type));
}
function fingerprint(items: HistoryItem[]): string {
  return sha256(JSON.stringify(items.map(item => [item.idDocumento ?? null, item.expediente ?? null, item.dataPublicacao ?? null])));
}
async function materialize(
  registrationNumber: string, idProduto: number, item: HistoryItem,
  type: BulaKind, buffer: Buffer, sha: string,
): Promise<StoredVersion> {
  const saved = await getVersion(registrationNumber, type, sha);
  if (saved) return saved;
  const extracted = await extractDocuments(buffer);
  const result: StoredVersion = {
    registrationNumber, idProduto, type, expediente: item.expediente ?? "",
    publicationDate: item.dataPublicacao ?? "", sha256: sha,
    documents: extracted.documents, extractionMethod: extracted.method,
  };
  await saveVersion(result);
  return result;
}
async function downloadWithFreshToken(api: AnvisaBrowser, item: HistoryItem, type: BulaKind, idProduto: number) {
  const id = versionId(item, type);
  if (!id) throw new Error(`Versão sem identificador de ${type.toUpperCase()}.`);
  try { return await api.pdf(id); }
  catch (error: any) {
    if (!/HTTP (400|401|403)/.test(error.message ?? "")) throw error;
    const refreshed = availableVersions(await api.history(idProduto), type);
    const renewed = refreshed.find(entry => item.idDocumento != null
      ? String(entry.idDocumento) === String(item.idDocumento)
      : entry.expediente === item.expediente && entry.dataPublicacao === item.dataPublicacao);
    const newId = renewed && versionId(renewed, type);
    if (!newId) throw error;
    return api.pdf(newId);
  }
}

export async function compareLatest(input: {
  idProduto: number; registrationNumber: string; type: BulaKind;
  productName?: string; holder?: string;
}): Promise<Comparison> {
  const { idProduto, type } = input;
  const registrationNumber = input.registrationNumber.replace(/\D/g, "");
  if (!Number.isSafeInteger(idProduto) || idProduto < 1 || !/^\d{9,20}$/.test(registrationNumber)) {
    throw new Error("Selecione um medicamento válido na base do DBULÁRIO.");
  }
  const api = new AnvisaBrowser();
  try {
    await api.open(idProduto, registrationNumber);
    const history = await api.history(idProduto);
    const apiRegistration = String(history?.registroProduto ?? "").replace(/\D/g, "");
    if (apiRegistration && apiRegistration !== registrationNumber) {
      throw new Error("O ID Produto não corresponde ao registro retornado pela ANVISA.");
    }
    const items = availableVersions(history, type);
    if (items.length < 2) throw new Error(`Não há duas versões de ${type.toUpperCase()} no histórico da ANVISA.`);
    const historyFingerprint = fingerprint(items);
    const snapshot = await getSnapshot(registrationNumber, type, historyFingerprint);
    if (snapshot) return snapshot;
    const currentItem = items[0];
    const currentPdf = await downloadWithFreshToken(api, currentItem, type, idProduto);
    const currentSha = sha256(currentPdf);
    let previousItem: HistoryItem | undefined;
    let previousPdf: Buffer | undefined;
    let previousSha = "";
    for (const item of items.slice(1)) {
      const candidate = await downloadWithFreshToken(api, item, type, idProduto);
      const hash = sha256(candidate);
      if (hash === currentSha) continue;
      previousItem = item;
      previousPdf = candidate;
      previousSha = hash;
      break;
    }
    if (!previousItem || !previousPdf) throw new Error(`Não existe versão anterior com PDF diferente para ${type.toUpperCase()}.`);
    const cached = await getComparison(registrationNumber, type, previousSha, currentSha);
    if (cached) {
      await saveSnapshot(registrationNumber, type, historyFingerprint, cached);
      return cached;
    }
    const oldVersion = await materialize(registrationNumber, idProduto, previousItem, type, previousPdf, previousSha);
    const newVersion = await materialize(registrationNumber, idProduto, currentItem, type, currentPdf, currentSha);
    const sections = compareDocuments(oldVersion.documents, newVersion.documents);
    const changed = sections.filter(section => section.changed);
    const result: Comparison = {
      registrationNumber, idProduto, type,
      productName: input.productName || String(history?.nomeProduto ?? ""),
      holder: input.holder || String(history?.razaoSocial ?? ""),
      previous: { expediente: oldVersion.expediente, publicationDate: oldVersion.publicationDate, sha256: oldVersion.sha256 },
      current: { expediente: newVersion.expediente, publicationDate: newVersion.publicationDate, sha256: newVersion.sha256 },
      summary: {
        changedSections: changed.length,
        addedWords: changed.reduce((sum, section) => sum + section.addedWords, 0),
        removedWords: changed.reduce((sum, section) => sum + section.removedWords, 0),
        similarity: sections.length ? sections.reduce((sum, section) => sum + section.similarity, 0) / sections.length : 1,
      },
      sections, createdAt: new Date().toISOString(), cached: false, stale: false,
    };
    await saveComparison(result);
    await saveSnapshot(registrationNumber, type, historyFingerprint, result);
    return result;
  } catch (error) {
    if (error instanceof AnvisaAccessError) {
      console.error("[BULA_DIFF] anvisa_access_error", { code: error.code, stage: error.stage, status: error.httpStatus ?? null, environment: process.env.VERCEL ? "vercel" : "local" });
      try {
        const saved = await getSnapshot(registrationNumber, type, "");
        if (saved) {
          console.warn("[BULA_DIFF] returning_unverified_saved_comparison", { registrationNumber, type });
          return saved;
        }
      } catch (cacheError) {
        console.error("[BULA_DIFF] cache_lookup_failed", { reason: cacheError instanceof Error ? cacheError.message.slice(0, 250) : "unknown" });
      }
    }
    throw error;
  } finally {
    await api.close();
  }
}
