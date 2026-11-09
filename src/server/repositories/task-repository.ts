import "server-only";

import { randomUUID } from "node:crypto";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type Task,
  type UpdateTaskInput,
} from "../../lib/tasks";

export function createTaskRepository() {
  const tasks = new Map<string, Task>();

  return {
    list(): Task[] {
      return Array.from(tasks.values())
        .sort(
          (left, right) =>
            right.createdAt.localeCompare(left.createdAt) ||
            left.id.localeCompare(right.id),
        )
        .map((task) => ({ ...task }));
    },

    getById(id: string): Task | undefined {
      const task = tasks.get(id);
      return task && { ...task };
    },

    create(input: CreateTaskInput): Task {
      const { title, description } = createTaskSchema.parse(input);
      const timestamp = new Date().toISOString();
      const task: Task = {
        id: randomUUID(),
        title,
        description,
        createdAt: timestamp,
        updatedAt: timestamp,
      };

      tasks.set(task.id, task);
      return { ...task };
    },

    update(id: string, input: UpdateTaskInput): Task | undefined {
      const { title, description } = updateTaskSchema.parse(input);
      const current = tasks.get(id);
      if (!current) return undefined;

      const task: Task = {
        ...current,
        title: title ?? current.title,
        description: description ?? current.description,
        updatedAt: new Date().toISOString(),
      };

      tasks.set(id, task);
      return { ...task };
    },

    delete(id: string): boolean {
      return tasks.delete(id);
    },
  };
}

// Share the store across server entry points loaded in the same process.
const processGlobal = globalThis as typeof globalThis & {
  artefactTaskRepository?: ReturnType<typeof createTaskRepository>;
};

export const taskRepository =
  (processGlobal.artefactTaskRepository ??= createTaskRepository());
