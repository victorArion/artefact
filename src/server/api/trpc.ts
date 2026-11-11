import "server-only";

import { initTRPC } from "@trpc/server";
import { ZodError } from "zod";
import type { taskRepository } from "../repositories/taskRepository";

type Context = {
  taskRepository: typeof taskRepository;
};

const t = initTRPC.context<Context>().create({
  isDev: false,
  errorFormatter({ shape, error }) {
    if (error.code === "INTERNAL_SERVER_ERROR") {
      return { ...shape, message: "Internal server error." };
    }
    const { cause } = error;
    if (error.code === "BAD_REQUEST" && cause instanceof ZodError) {
      const validationFields = (["title", "description"] as const).filter((field) =>
        cause.issues.some(({ path }) =>
          path[0] === field || (path[0] === "changes" && path[1] === field),
        ),
      );
      return { ...shape, message: "Invalid input.", data: { ...shape.data, validationFields } };
    }
    return shape;
  },
});

export const router = t.router;
export const procedure = t.procedure.use(async ({ next, path, type }) => {
  const result = await next();
  if (!result.ok && result.error.code === "INTERNAL_SERVER_ERROR") {
    // Only log router metadata: causes and request inputs can contain task data.
    console.error("Task procedure failed", { path, type, code: result.error.code, result: result });
  }
  return result;
});
