import "server-only";

import { randomUUID } from "node:crypto";
import { createInitialTasks } from "./initialTasks";
import {
  createTaskSchema,
  updateTaskSchema,
  type CreateTaskInput,
  type Task,
  type TaskCursor,
  type TaskPage,
  type UpdateTaskInput,
} from "../../lib/tasks";

const pageSize = 10;

type TaskPosition = Pick<Task, "createdAt" | "id">;

function compareTaskOrder(left: TaskPosition, right: TaskPosition) {
  return right.createdAt.localeCompare(left.createdAt) || left.id.localeCompare(right.id);
}

export function createTaskRepository(initialTasks: readonly Task[] = []) {
  const tasks = new Map(initialTasks.map((task) => [task.id, { ...task }]));
  // Retain the position of deleted tasks so clients can resume from their UUIDs.
  const deletedTaskTimestamps = new Map<string, string>();

  return {
    listPage(cursor?: TaskCursor): TaskPage | undefined {
      let position: TaskPosition | undefined;
      if (cursor !== undefined) {
        const createdAt = tasks.get(cursor)?.createdAt ?? deletedTaskTimestamps.get(cursor);
        if (createdAt === undefined) return undefined;
        position = { id: cursor, createdAt };
      }

      const matches = Array.from(tasks.values())
        .filter((task) => !position || compareTaskOrder(task, position) > 0)
        .sort(compareTaskOrder)
        .slice(0, pageSize + 1);
      const page = matches.slice(0, pageSize);
      const last = page.at(-1);

      return {
        tasks: page.map((task) => ({ ...task })),
        nextCursor: matches.length > pageSize && last ? last.id : null,
      };
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
      const task = tasks.get(id);
      if (!task) return false;
      deletedTaskTimestamps.set(id, task.createdAt);
      return tasks.delete(id);
    },
  };
}

// Share the store across server entry points loaded in the same process.
const processGlobal = globalThis as typeof globalThis & {
  artefactTaskRepository?: ReturnType<typeof createTaskRepository>;
};

export const taskRepository =
  (processGlobal.artefactTaskRepository ??= createTaskRepository(
    createInitialTasks(Math.max(0, Number.parseInt(process.env.TASK_SEED_COUNT ?? "0", 10) || 0)),
  ));
