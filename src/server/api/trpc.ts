import "server-only";

import { initTRPC } from "@trpc/server";
import type { taskRepository } from "../repositories/task-repository";

type Context = {
  taskRepository: typeof taskRepository;
};

const t = initTRPC.context<Context>().create({
  isDev: false,
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return { ...shape, message: "Internal server error." };
    }
    return shape;
  },
});

export const router = t.router;
export const procedure = t.procedure;
