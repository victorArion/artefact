/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Task } from "@/lib/tasks";
import type { createTaskClient as clientFactory } from "@/trpc/client";
import QueryProvider from "@/trpc/queryProvider";

const replace = jest.fn();
const refresh = jest.fn();
type Client = ReturnType<typeof clientFactory>;
const mutate = jest.fn<Client["task"]["create"]["mutate"]>();
const update = jest.fn<Client["task"]["update"]["mutate"]>();
const createTaskClient = jest.fn<() => { task: Partial<Client["task"]> }>();
jest.doMock("@/trpc/client", () => ({ createTaskClient }));
jest.doMock("next/navigation", () => ({ useRouter: () => ({ replace, refresh }) }));
const { default: TaskForm } = jest.requireActual<typeof import("@/components/task/form")>("@/components/task/form");
const task: Task = { id: "f4ade6a1-5d63-4b7c-b65e-1da98f95153d", title: "Existing", description: "Details", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" };

afterEach(() => { jest.clearAllMocks(); });

test("validates required fields before creating and navigates after success", async () => {
  createTaskClient.mockReturnValue({ task: { create: { mutate } } });
  mutate.mockResolvedValue(task);
  render(<QueryProvider><TaskForm /></QueryProvider>);
  fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
  expect(await screen.findByText("Informe o título da tarefa.")).toBeTruthy();
  expect(screen.getByText("Informe a descrição da tarefa.")).toBeTruthy();
  expect(mutate).not.toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText(/Título/), { target: { value: "New" } });
  fireEvent.change(screen.getByLabelText(/Descrição/), { target: { value: "Body" } });
  fireEvent.click(screen.getByRole("button", { name: "Criar tarefa" }));
  await waitFor(() => expect(mutate).toHaveBeenCalledWith({ title: "New", description: "Body" }));
  expect(replace).toHaveBeenCalledWith("/", { scroll: false });
  expect(refresh).toHaveBeenCalled();
});

test("prefills and updates an existing task", async () => {
  createTaskClient.mockReturnValue({ task: { update: { mutate: update } } });
  update.mockResolvedValue(task);
  render(<QueryProvider><TaskForm task={task} /></QueryProvider>);
  expect((screen.getByLabelText(/Título/) as HTMLInputElement).value).toBe("Existing");
  fireEvent.click(screen.getByRole("button", { name: "Salvar alterações" }));
  await waitFor(() => expect(update).toHaveBeenCalledWith({ id: task.id, changes: { title: task.title, description: task.description } }));
});
