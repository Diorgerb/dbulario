import { z } from "zod";
import { publicProcedure, router } from "../_core/trpc";
import {
  listMedications,
  searchMedications,
  getMedicationStats,
  getMedicationById,
  getRecentUpdates,
} from "../lib/csv-loader";

export const medicationsRouter = router({
  /* -------------------- LISTAGEM PRINCIPAL -------------------- */
  list: publicProcedure
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(10),

        /**
         * Busca textual:
         * - aceita múltiplos termos separados por vírgula ou espaço
         * - nomeProduto, numeroRegistro, razaoSocial, cnpj, numProcesso
         */
        search: z.string().optional(),

        // Filtros diretos (opcionais)
        numeroRegistro: z.string().optional(),
        razaoSocial: z.string().optional(),
        cnpj: z.string().optional(),

        /**
         * Intervalo em dias
         * baseado em `data` (data de atualização)
         */
        dateRange: z.number().int().min(0).max(180).optional(),
      })
    )
    .query(({ input }) => {
      return listMedications(input.page, input.limit, {
        search: input.search,
        numeroRegistro: input.numeroRegistro,
        razaoSocial: input.razaoSocial,
        cnpj: input.cnpj,
        dateRange: input.dateRange,
      });
    }),

  /* -------------------- BUSCA RÁPIDA -------------------- */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        limit: z.number().int().positive().max(20).default(10),
      })
    )
    .query(({ input }) => {
      return searchMedications(input.query, {
        limit: input.limit,
      });
    }),

  /* -------------------- ESTATÍSTICAS -------------------- */
  stats: publicProcedure.query(() => {
    return getMedicationStats();
  }),

  /* -------------------- ATUALIZAÇÕES RECENTES -------------------- */
  recentUpdates: publicProcedure
    .input(
      z.object({
        days: z.number().int().positive().max(180).default(7),
      })
    )
    .query(({ input }) => {
      return getRecentUpdates(input.days);
    }),

  /* -------------------- DETALHE POR ID -------------------- */
  getById: publicProcedure
    .input(
      z.object({
        idProduto: z.number().int().positive(),
      })
    )
    .query(({ input }) => {
      return getMedicationById(input.idProduto);
    }),
});
