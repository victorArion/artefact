import "server-only";

import { taskRouter } from "./routers/task";
import { router } from "./trpc";

export const appRouter = router({ task: taskRouter });

export type AppRouter = typeof appRouter;
