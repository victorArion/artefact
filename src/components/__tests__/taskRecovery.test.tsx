/** @jest-environment jsdom */

import { afterEach, expect, jest, test } from "@jest/globals";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { TRPCClientError } from "@trpc/client";
import type { Task } from "@/lib/tasks";
import { taskRepository } from "@/server/repositories/taskRepository";

const refresh = jest.fn();
const replace = jest.fn();
type TaskClient = ReturnType<typeof import("@/trpc/client").createTaskClient>;
const createTaskClient = jest.fn<() => { task: Partial<TaskClient["task"]> }>();

jest.doMock("@/trpc/client", () => ({ createTaskClient }));
jest.doMock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  useRouter: () => ({ refresh, replace }),
}));

const { default: TaskListLoader } = jest.requireActual<typeof import("@/components/task/listLoader")>(
  "@/components/task/listLoader",
);
const { default: TaskForm } = jest.requireActual<typeof import("@/components/task/form")>("@/components/task/form");
const { default: TaskPage } = jest.requireActual<typeof import("@/components/task/page")>("@/components/task/page");
const task: Task = {
  id: "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178",
  title: "Tarefa já carregada",
  description: "Descrição original",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

test("shows an SSR alert and offers refresh when the first page cannot load", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(taskRepository, "listPage").mockImplementation(() => {
    throw new Error("private failure");
  });

  render(await TaskListLoader());

  expect(screen.getByRole("alert").textContent).toContain("Não foi possível carregar as tarefas.");
  expect(screen.queryByText("Nenhuma tarefa cadastrada.")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
  expect(refresh).toHaveBeenCalledTimes(1);
});

test("preserves form values and offers another submission after a connection failure", async () => {
  const mutate = jest.fn<TaskClient["task"]["create"]["mutate"]>()
    .mockRejectedValueOnce(new TRPCClientError("private failure", { cause: new TypeError("fetch failed") }))
    .mockResolvedValueOnce(task);
  createTaskClient.mockReturnValue({
    task: { create: { mutate } },
  });

  render(<TaskForm />);
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: task.title } });
  fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: task.description } });
  fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));

  expect((await screen.findByRole("alert")).textContent).toContain("Verifique sua conexão");
  expect((screen.getByLabelText(/Título/) as HTMLInputElement).value).toBe(task.title);
  expect((screen.getByLabelText(/Descrição/) as HTMLTextAreaElement).value).toBe(task.description);
  expect(replace).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
  await waitFor(() => expect(replace).toHaveBeenCalledWith("/"));
});

test("keeps cards after a cursor failure and restarts pagination at the first page", async () => {
  const query = jest.fn<TaskClient["task"]["listPage"]["query"]>()
    .mockRejectedValueOnce(new TRPCClientError("private failure", {
      result: { error: { message: "private failure", code: -32004, data: { code: "NOT_FOUND", httpStatus: 404 } } },
    }))
    .mockResolvedValueOnce({ tasks: [{ ...task, title: "Lista atualizada" }], nextCursor: null });
  createTaskClient.mockReturnValue({
    task: { listPage: { query } },
  });

  render(<TaskPage firstPage={{ tasks: [task], nextCursor: task.id }} />);
  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));

  expect((await screen.findByRole("alert")).textContent).toContain("Recarregue desde o início");
  expect(screen.getByText(task.title)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Recarregar lista" }));

  expect(await screen.findByText("Lista atualizada")).toBeTruthy();
  expect(query.mock.calls.map(([input]) => input.cursor)).toEqual([task.id, undefined]);
});

test("shows a refresh failure separately after a successful deletion", async () => {
  const query = jest.fn<TaskClient["task"]["listPage"]["query"]>()
    .mockRejectedValue(new Error("private failure"));
  const mutate = jest.fn<TaskClient["task"]["delete"]["mutate"]>()
    .mockResolvedValue({ id: task.id });
  createTaskClient.mockReturnValue({
    task: { listPage: { query }, delete: { mutate } },
  });

  render(<TaskPage firstPage={{ tasks: [task], nextCursor: null }} />);
  fireEvent.click(screen.getByRole("button", { name: `Excluir tarefa: ${task.title}` }));
  fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

  expect((await screen.findByRole("alert")).textContent).toContain("Não foi possível atualizar a lista");
  expect(screen.getByRole("status").textContent).toContain("excluída");
  expect(screen.queryByText(task.title)).toBeNull();
});
