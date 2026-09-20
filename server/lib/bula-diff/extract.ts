export type ExtractedDocument = { label: string; sections: Record<string, string> };
type Line = { text: string; y: number; x: number };
const normalize = (s: string) => s.replace(/\s+/g, " ").trim();
const runningKey = (s: string) => normalize(s).replace(/\d+/g, "#").toUpperCase();

async function extractPages(buffer: Buffer): Promise<string[][]> {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer), disableFontFace: true }).promise;
  const pages: string[][] = [];
  try {
    for (let index = 1; index <= doc.numPages; index++) {
      const page = await doc.getPage(index);
      const items = (await page.getTextContent()).items as Array<{ str?: string; transform?: number[] }>;
      const positions: Line[] = items.filter(item => !!item.str).map(item => ({
        text: String(item.str), x: Number(item.transform?.[4] ?? 0), y: Number(item.transform?.[5] ?? 0),
      }));
      positions.sort((a, b) => Math.abs(b.y - a.y) > 2 ? b.y - a.y : a.x - b.x);
      const rows: Array<{ y: number; parts: Line[] }> = [];
      for (const item of positions) {
        const row = rows.find(entry => Math.abs(entry.y - item.y) <= 2);
        if (row) row.parts.push(item);
        else rows.push({ y: item.y, parts: [item] });
      }
      rows.sort((a, b) => b.y - a.y);
      pages.push(rows.map(row => normalize(row.parts.sort((a, b) => a.x - b.x).map(part => part.text).join(" "))).filter(Boolean));
    }
  } finally {
    await doc.destroy();
  }
  return pages;
}

function stripHeaders(pages: string[][]): string[][] {
  if (pages.length < 3) return pages;
  const frequencies = new Map<string, number>();
  for (const page of pages) {
    for (const line of new Set([...page.slice(0, 2), ...page.slice(-2)].map(runningKey))) {
      frequencies.set(line, (frequencies.get(line) ?? 0) + 1);
    }
  }
  const repeated = new Set([...frequencies].filter(([, count]) => count >= Math.max(3, Math.ceil(pages.length * .4))).map(([key]) => key));
  return pages.map(page => page.filter((line, index) => {
    if (/^[-–]?\s*\d+(\s*(de|\/)\s*\d+)?\s*[-–]?$/.test(line)) return false;
    const edge = index < 2 || index >= page.length - 2;
    return !(edge && repeated.has(runningKey(line)));
  }));
}

const SECTION_NAMES: Array<[RegExp, string]> = [
  [/^(?:I\s*[-–]?\s*)?IDENTIFICAÇÃO DO MEDICAMENTO\s*:??$/i, "I"],
  [/^(?:II\s*[-–]?\s*)?INFORMAÇÕES AO PACIENTE\s*:??$/i, "II"],
  [/^(?:II\s*[-–]?\s*)?INFORMAÇÕES TÉCNICAS AOS PROFISSIONAIS DE SAÚDE\s*:??$/i, "II"],
  [/^(?:III\s*[-–]?\s*)?DIZERES LEGAIS\s*:??$/i, "III"],
];
const NUMBERED = /^(\d{1,2})\s*[.)-]\s*([A-ZÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇ0-9 ,?/()\-]{3,})\s*$/;
function roman(line: string): string | null {
  for (const [pattern, key] of SECTION_NAMES) if (pattern.test(line)) return key;
  return null;
}
function label(sections: Record<string, string>): string {
  const base = sections.I || sections.PREAMBLE || "Apresentação";
  return ((base.split(/APRESENTAÇÕES/i)[1] || base).split(/\b(?:USO|COMPOSIÇÃO)\b/i)[0].trim().slice(0, 100) || "Apresentação");
}

export async function extractDocuments(buffer: Buffer): Promise<{ method: string; documents: ExtractedDocument[] }> {
  const lines = stripHeaders(await extractPages(buffer)).flat();
  const documents: ExtractedDocument[] = [];
  let sections: Record<string, string[]> = { PREAMBLE: [] };
  let current = "PREAMBLE";
  let inHistory = false;
  const flush = () => {
    const result: Record<string, string> = {};
    for (const [section, chunks] of Object.entries(sections)) {
      const text = normalize(chunks.join(" "));
      if (text) result[section] = text;
    }
    if (Object.values(result).join(" ").length > 500) documents.push({ label: label(result), sections: result });
    sections = { PREAMBLE: [] };
    current = "PREAMBLE";
    inHistory = false;
  };
  for (const raw of lines) {
    const line = normalize(raw);
    if (!line) continue;
    if (/hist[óo]rico\s+d[aeo]s?\s+altera[çc]/i.test(line)) { inHistory = true; continue; }
    const part = roman(line);
    if (inHistory && part !== "I") continue;
    if (part === "I" && (sections.I?.length || Object.keys(sections).some(key => /^\d+$/.test(key)))) flush();
    if (part) { current = part; sections[current] ??= []; continue; }
    if (/^APRESENTAÇÕES\s*:??$/i.test(line) && Object.keys(sections).some(key => /^\d+$/.test(key))) {
      flush(); current = "I"; sections.I = []; continue;
    }
    const numbered = line.match(NUMBERED);
    if (numbered) { current = numbered[1]; sections[current] ??= []; continue; }
    sections[current] ??= [];
    sections[current].push(line);
  }
  flush();
  if (!documents.length && lines.length) documents.push({ label: "Bula", sections: { FULL: normalize(lines.join(" ")) } });
  if (!documents.length) throw new Error("O PDF não produziu texto. Pode ser uma bula digitalizada, que exige OCR.");
  return { method: "pdfjs-sections-v1", documents };
}
