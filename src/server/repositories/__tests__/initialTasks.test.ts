import { expect, test } from "@jest/globals";
import { createInitialTasks } from "../initialTasks";

test("generates the requested number of unique demo tasks", () => {
  const tasks = createInitialTasks(200, new Date("2026-01-01T00:00:00.000Z"));

  expect(tasks).toHaveLength(200);
  expect(new Set(tasks.map(({ id }) => id)).size).toBe(200);
  expect(tasks[0]).toMatchObject({
    title: "Tarefa inicial 1",
    description: "Descrição da tarefa de demonstração 1.",
    createdAt: "2026-01-01T00:00:00.000Z",
  });
  expect(tasks[199].createdAt).toBe("2025-12-31T20:41:00.000Z");
  expect(tasks.every(({ createdAt, updatedAt }) => createdAt === updatedAt)).toBe(true);
});

test("returns no demo tasks when the requested count is zero", () => {
  expect(createInitialTasks(0)).toEqual([]);
});
