import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../server/api/root";
import { taskRepository } from "../../../../server/repositories/taskRepository";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function handler(req: Request) {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => ({ taskRepository }),
    responseMeta: () => ({
      headers: new Headers({ "Cache-Control": "no-store" }),
    }),
  });
}

export { handler as GET, handler as POST };
