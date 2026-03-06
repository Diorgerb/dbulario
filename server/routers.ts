import { systemRouter } from "./_core/systemRouter.js";
import { publicProcedure, router } from "./_core/trpc.js";
import { medicationsRouter } from "./routers/medications.js";
import { adminRouter } from "./routers/admin.js";

export const appRouter = router({
  system: systemRouter,
  medications: medicationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
