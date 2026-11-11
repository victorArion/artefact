/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import type { TaskPage } from "@/lib/tasks";
import type { createTaskClient as clientFactory } from "@/trpc/client";

type Client = ReturnType<typeof clientFactory>;
const query = jest.fn<Client["task"]["listPage"]["query"]>();
const createTaskClient = jest.fn<() => { task: Partial<Client["task"]> }>();
jest.doMock("@/trpc/client", () => ({ createTaskClient }));
const { default: TaskPageComponent } = jest.requireActual<typeof import("@/components/task/page")>("@/components/task/page");
const firstPage: TaskPage = { tasks: [{ id: "f4ade6a1-5d63-4b7c-b65e-1da98f95153d", title: "SSR task", description: "Rendered immediately", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }], nextCursor: null };
afterEach(() => { jest.clearAllMocks(); });

test("composes the heading, create action, and initial task list", () => {
  createTaskClient.mockReturnValue({ task: { listPage: { query } } });
  render(<TaskPageComponent firstPage={firstPage} />);
  expect(screen.getByRole("heading", { name: "Tarefas" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Nova tarefa" }).getAttribute("href")).toBe("/tasks/new");
  expect(screen.getByRole("heading", { name: "SSR task" })).toBeTruthy();
});

