import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { medicationsRouter } from "./routers/medications";
import { adminRouter } from "./routers/admin";

export const appRouter = router({
  system: systemRouter,
  medications: medicationsRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
