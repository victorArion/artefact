/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { Task, TaskPage } from "@/lib/tasks";
import type { createTaskClient as clientFactory } from "@/trpc/client";

type Client = ReturnType<typeof clientFactory>;
const query = jest.fn<Client["task"]["listPage"]["query"]>();
const createTaskClient = jest.fn<() => { task: Partial<Client["task"]> }>();
jest.doMock("@/trpc/client", () => ({ createTaskClient }));
const { default: TaskList } = jest.requireActual<typeof import("@/components/task/list")>("@/components/task/list");
const task: Task = { id: "f4ade6a1-5d63-4b7c-b65e-1da98f95153d", title: "Review", description: "Full task description", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };
const page: TaskPage = { tasks: [task], nextCursor: null };
const onTaskDeleted = jest.fn();
afterEach(() => { jest.clearAllMocks(); });

test("renders task cards with description tooltip and edit/delete actions", () => {
  createTaskClient.mockReturnValue({ task: { listPage: { query } } });
  const queryClient = new QueryClient();
  render(<QueryClientProvider client={queryClient}><TaskList firstPage={page} headingRef={{ current: null }} onTaskDeleted={onTaskDeleted} /></QueryClientProvider>);
  expect(screen.getByRole("list", { name: "Lista de tarefas" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: task.title })).toBeTruthy();
  expect(screen.getByText(task.description)).toBeTruthy();
  expect(screen.getByRole("link", { name: `Editar tarefa: ${task.title}` }).getAttribute("href")).toBe(`/tasks/${task.id}/edit`);
  expect(screen.getByRole("button", { name: `Excluir tarefa: ${task.title}` })).toBeTruthy();
  queryClient.clear();
});

test("shows the empty state when there are no tasks and no next page", () => {
  createTaskClient.mockReturnValue({ task: { listPage: { query } } });
  const queryClient = new QueryClient();
  render(<QueryClientProvider client={queryClient}><TaskList firstPage={{ tasks: [], nextCursor: null }} headingRef={{ current: null }} onTaskDeleted={onTaskDeleted} /></QueryClientProvider>);
  expect(screen.getByText("Nenhuma tarefa cadastrada.")).toBeTruthy();
  queryClient.clear();
});
