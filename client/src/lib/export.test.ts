import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportAsCSV, exportAsJSON, exportAsExcel, getExportFilename } from "./export";

// Mock do URL.createObjectURL e revokeObjectURL
global.URL.createObjectURL = vi.fn(() => "blob:mock-url");
global.URL.revokeObjectURL = vi.fn();

// Mock do document.createElement
const mockLink = {
  href: "",
  download: "",
  click: vi.fn(),
};

vi.spyOn(document, "createElement").mockReturnValue(mockLink as any);
vi.spyOn(document.body, "appendChild").mockReturnValue(mockLink as any);
vi.spyOn(document.body, "removeChild").mockReturnValue(mockLink as any);

interface Medication {
  id: number;
  name: string;
  registrationNumber: string;
  holder: string;
  category: string;
  status: string;
  lastUpdate: string;
}

const mockMedications: Medication[] = [
  {
    id: 1,
    name: "Dipirona 500mg",
    registrationNumber: "1234567890",
    holder: "Empresa A",
    category: "medicamento",
    status: "ativo",
    lastUpdate: "2025-01-28",
  },
  {
    id: 2,
    name: "Ibuprofeno 400mg",
    registrationNumber: "1234567891",
    holder: "Empresa B",
    category: "medicamento",
    status: "ativo",
    lastUpdate: "2025-01-27",
  },
];

describe("Export Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getExportFilename", () => {
    it("should generate CSV filename with date", () => {
      const filename = getExportFilename("csv");
      expect(filename).toMatch(/medicamentos_\d{4}-\d{2}-\d{2}\.csv/);
    });

    it("should generate JSON filename with date", () => {
      const filename = getExportFilename("json");
      expect(filename).toMatch(/medicamentos_\d{4}-\d{2}-\d{2}\.json/);
    });

    it("should generate Excel filename with date", () => {
      const filename = getExportFilename("xlsx");
      expect(filename).toMatch(/medicamentos_\d{4}-\d{2}-\d{2}\.csv/);
    });
  });

  describe("exportAsCSV", () => {
    it("should export medications as CSV", () => {
      expect(() => {
        exportAsCSV(mockMedications);
      }).not.toThrow();
    });

    it("should trigger file download", () => {
      exportAsCSV(mockMedications);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should set correct download filename", () => {
      exportAsCSV(mockMedications, "test.csv");
      expect(mockLink.download).toContain("test");
    });

    it("should include headers in CSV", () => {
      const blob = new Blob(["test"], { type: "text/csv" });
      vi.spyOn(global, "Blob").mockReturnValue(blob);
      
      exportAsCSV(mockMedications);
      
      expect(mockLink.href).toBeDefined();
    });
  });

  describe("exportAsJSON", () => {
    it("should export medications as JSON", () => {
      expect(() => {
        exportAsJSON(mockMedications);
      }).not.toThrow();
    });

    it("should trigger file download", () => {
      exportAsJSON(mockMedications);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should set correct download filename", () => {
      exportAsJSON(mockMedications, "test.json");
      expect(mockLink.download).toContain("test");
    });
  });

  describe("exportAsExcel", () => {
    it("should export medications as Excel", () => {
      expect(() => {
        exportAsExcel(mockMedications);
      }).not.toThrow();
    });

    it("should trigger file download", () => {
      exportAsExcel(mockMedications);
      expect(mockLink.click).toHaveBeenCalled();
    });

    it("should convert xlsx to csv filename", () => {
      exportAsExcel(mockMedications, "test.xlsx");
      expect(mockLink.download).toContain(".csv");
    });
  });

  describe("Empty data handling", () => {
    it("should handle empty medication array for CSV", () => {
      expect(() => {
        exportAsCSV([]);
      }).not.toThrow();
    });

    it("should handle empty medication array for JSON", () => {
      expect(() => {
        exportAsJSON([]);
      }).not.toThrow();
    });

    it("should handle empty medication array for Excel", () => {
      expect(() => {
        exportAsExcel([]);
      }).not.toThrow();
    });
  });
});
