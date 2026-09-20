import { diffWordsWithSpace } from "diff";
import type { ExtractedDocument } from "./extract.js";

export type DiffPart = { type: "equal" | "added" | "removed"; text: string };
export type SectionDiff = {
  document: number; label: string; section: string; changed: boolean;
  addedWords: number; removedWords: number; similarity: number; parts: DiffPart[];
};
const wordCount = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
function similarity(a: string, b: string) {
  const left = new Set(a.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const right = new Set(b.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  if (!left.size && !right.size) return 1;
  let shared = 0;
  for (const item of left) if (right.has(item)) shared++;
  return shared / Math.max(1, new Set([...left, ...right]).size);
}
function pairDocuments(a: ExtractedDocument[], b: ExtractedDocument[]) {
  const pairs: Array<[number | null, number | null]> = [];
  const candidates: Array<[number, number, number]> = [];
  for (let i = 0; i < a.length; i++) for (let j = 0; j < b.length; j++) {
    candidates.push([similarity(Object.values(a[i].sections).join(" ").slice(0, 30000), Object.values(b[j].sections).join(" ").slice(0, 30000)), i, j]);
  }
  candidates.sort((x, y) => y[0] - x[0]);
  const usedA = new Set<number>(), usedB = new Set<number>();
  for (const [, i, j] of candidates) {
    if (usedA.has(i) || usedB.has(j)) continue;
    usedA.add(i); usedB.add(j); pairs.push([i, j]);
  }
  for (let i = 0; i < a.length; i++) if (!usedA.has(i)) pairs.push([i, null]);
  for (let j = 0; j < b.length; j++) if (!usedB.has(j)) pairs.push([null, j]);
  return pairs;
}
export function compareDocuments(previous: ExtractedDocument[], current: ExtractedDocument[]): SectionDiff[] {
  const result: SectionDiff[] = [];
  pairDocuments(previous, current).forEach(([leftIndex, rightIndex], documentIndex) => {
    const left = leftIndex === null ? {} : previous[leftIndex].sections;
    const right = rightIndex === null ? {} : current[rightIndex].sections;
    const label = (rightIndex === null ? previous[leftIndex!] : current[rightIndex]).label;
    const order = (key: string) => key === "I" ? 0 : key === "II" ? 1 : /^\d+$/.test(key) ? 2 + Number(key) : key === "III" ? 99 : 100;
    const sections = [...new Set([...Object.keys(left), ...Object.keys(right)])].filter(key => key !== "PREAMBLE").sort((x, y) => order(x) - order(y));
    for (const section of sections) {
      const before = left[section] ?? "";
      const after = right[section] ?? "";
      if (before === after) {
        result.push({ document: documentIndex + 1, label, section, changed: false, addedWords: 0, removedWords: 0, similarity: 1, parts: [] });
        continue;
      }
      let added = 0, removed = 0, unchanged = 0, total = 0;
      const parts: DiffPart[] = diffWordsWithSpace(before, after).map(chunk => {
        const count = wordCount(chunk.value); total += count;
        if (chunk.added) { added += count; return { type: "added", text: chunk.value }; }
        if (chunk.removed) { removed += count; return { type: "removed", text: chunk.value }; }
        unchanged += count; return { type: "equal", text: chunk.value };
      });
      result.push({ document: documentIndex + 1, label, section, changed: true, addedWords: added, removedWords: removed, similarity: total ? unchanged / total : 1, parts });
    }
  });
  return result;
}
