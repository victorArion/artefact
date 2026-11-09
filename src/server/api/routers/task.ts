import "server-only";

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTaskSchema, updateTaskSchema } from "../../../lib/tasks";
import { procedure, router } from "../trpc";

const taskIdSchema = z.strictObject({ id: z.uuid() });

function taskNotFound() {
  return new TRPCError({ code: "NOT_FOUND", message: "Task not found." });
}

export const taskRouter = router({
  list: procedure.input(z.void()).query(({ ctx }) => ctx.taskRepository.list()),

  getById: procedure.input(taskIdSchema).query(({ ctx, input }) => {
    const task = ctx.taskRepository.getById(input.id);
    if (!task) throw taskNotFound();
    return task;
  }),

  create: procedure.input(createTaskSchema).mutation(({ ctx, input }) => {
    return ctx.taskRepository.create(input);
  }),

  update: procedure
    .input(taskIdSchema.extend({ changes: updateTaskSchema }))
    .mutation(({ ctx, input }) => {
      const task = ctx.taskRepository.update(input.id, input.changes);
      if (!task) throw taskNotFound();
      return task;
    }),

  delete: procedure.input(taskIdSchema).mutation(({ ctx, input }) => {
    if (!ctx.taskRepository.delete(input.id)) throw taskNotFound();
    return { id: input.id };
  }),
});
