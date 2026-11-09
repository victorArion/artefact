import { z } from "zod";

export type Task = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

const titleSchema = z.string().trim().min(1).max(120);
const descriptionSchema = z.string().max(5_000);

export const createTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema.default(""),
});

export const updateTaskSchema = z
  .strictObject({
    title: titleSchema.optional(),
    description: descriptionSchema.optional(),
  })
  .refine(
    ({ title, description }) => title !== undefined || description !== undefined,
    "Provide a title or description to update.",
  );

export type CreateTaskInput = z.input<typeof createTaskSchema>;
export type UpdateTaskInput = z.input<typeof updateTaskSchema>;
