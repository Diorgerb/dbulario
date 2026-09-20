import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc.js";
import { getMedicationById } from "../lib/csv-loader.js";
import { compareLatest } from "../lib/bula-diff/pipeline.js";

export const bulaDiffRouter = router({
  compare: publicProcedure.input(z.object({
    idProduto: z.number().int().positive(),
    registrationNumber: z.string().regex(/^\d{9,20}$/),
    type: z.enum(["vp", "vps"]),
  })).mutation(async ({ input }) => {
    const medication = getMedicationById(input.idProduto);
    if (!medication || medication.registrationNumber.replace(/\D/g, "") !== input.registrationNumber) {
      throw new Error("Medicamento não encontrado na base do DBULÁRIO ou ID/registro divergentes.");
    }
    return compareLatest({
      ...input,
      productName: medication.name,
      holder: medication.holder ?? "",
    });
  }),
});
