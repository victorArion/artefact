import { z } from "zod";

export type Task = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export const taskCursorSchema = z.uuid();

export type TaskCursor = z.infer<typeof taskCursorSchema>;

export type TaskPage = {
  tasks: Task[];
  nextCursor: TaskCursor | null;
};

export const TASK_TITLE_MAX_LENGTH = 120;
export const TASK_DESCRIPTION_MAX_LENGTH = 5_000;

const titleSchema = z.string().trim().min(1).max(TASK_TITLE_MAX_LENGTH);
const descriptionSchema = z
  .string()
  .max(TASK_DESCRIPTION_MAX_LENGTH)
  .refine((description) => description.trim().length > 0, "Description is required.");

export const createTaskSchema = z.strictObject({
  title: titleSchema,
  description: descriptionSchema,
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
