import { createTRPCClient, httpLink } from "@trpc/client";
import type { AppRouter } from "../server/api/root";

export function createTaskClient(url = "/api/trpc") {
  return createTRPCClient<AppRouter>({ links: [httpLink({ url })] });
}
