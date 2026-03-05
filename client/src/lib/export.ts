// client/src/lib/export.ts

interface Medication {
  id: number;
  name: string;
  registrationNumber: string;
  holder: string | null;
  cnpj: string | null;
  processNumber: string | null;

  // campos do backend
  publicationDate: string | null; // atualização do bulário
  lastUpdate: string | null;       // inclusão na plataforma
}

/* -------------------- CSV -------------------- */
export function exportAsCSV(
  medications: Medication[],
  filename = "medicamentos.csv"
) {
  const headers = [
    "ID",
    "Nome",
    "Nº Registro",
    "Titular",
    "CNPJ",
    "Nº Processo",
    "Data de Atualização",
    "Data de Inclusão",
  ];

  const rows = medications.map((m) => [
    m.id,
    `"${m.name}"`,
    m.registrationNumber,
    `"${m.holder ?? ""}"`,
    m.cnpj ?? "",
    m.processNumber ?? "",
    m.publicationDate ?? "",
    m.lastUpdate ?? "",
  ]);

  const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

  downloadFile(csv, filename, "text/csv;charset=utf-8;");
}

/* -------------------- JSON -------------------- */
export function exportAsJSON(
  medications: Medication[],
  filename = "medicamentos.json"
) {
  downloadFile(JSON.stringify(medications, null, 2), filename, "application/json");
}

/* -------------------- EXCEL (CSV compatível) -------------------- */
export function exportAsExcel(
  medications: Medication[],
  filename = "medicamentos.xlsx"
) {
  const headers = [
    "ID",
    "Nome",
    "Nº Registro",
    "Titular",
    "CNPJ",
    "Nº Processo",
    "Data de Atualização",
    "Data de Inclusão",
  ];

  const rows = medications.map((m) => [
    m.id,
    m.name,
    m.registrationNumber,
    m.holder ?? "",
    m.cnpj ?? "",
    m.processNumber ?? "",
    m.publicationDate ?? "",
    m.lastUpdate ?? "",
  ]);

  const tsv = [headers.join("\t"), ...rows.map((r) => r.join("\t"))].join("\n");

  downloadFile(
    tsv,
    filename.replace(".xlsx", ".csv"),
    "text/tab-separated-values;charset=utf-8;"
  );
}

/* -------------------- HELPERS -------------------- */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

export function getExportFilename(format: "csv" | "json" | "excel"): string {
  const date = new Date().toISOString().split("T")[0];
  const ext = format === "excel" ? "csv" : format;
  return `medicamentos_${date}.${ext}`;
}
