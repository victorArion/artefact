import "server-only";

import { randomUUID } from "node:crypto";
import type { Task } from "../../lib/tasks";

export function createInitialTasks(count: number, now = new Date()): Task[] {
  return Array.from({ length: count }, (_, index) => {
    const timestamp = new Date(now.getTime() - index * 60_000).toISOString();

    return {
      id: randomUUID(),
      title: `Tarefa inicial ${index + 1}`,
      description: `Descrição da tarefa de demonstração ${index + 1}.`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  });
}
