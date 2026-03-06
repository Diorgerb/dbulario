import { router, publicProcedure } from "../_core/trpc.js";
import { getMedicationStats } from "../lib/csv-loader.js";

export const adminRouter = router({
  getMedicationStats: publicProcedure.query(async () => {
    try {
      const stats = getMedicationStats();
      return {
        total: stats.total,
        imported: stats.total > 0,
      };
    } catch (error) {
      console.error("[Stats] Error:", error);
      return {
        total: 0,
        imported: false,
      };
    }
  }),
});
