/** @jest-environment jsdom */

import { afterEach, beforeEach, expect, jest, test } from "@jest/globals";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { createTaskRepository } from "@/server/repositories/taskRepository";

let repository: ReturnType<typeof createTaskRepository>;
const refresh = jest.fn();

jest.doMock("@/server/repositories/taskRepository", () => ({
  get taskRepository() { return repository; },
}));
jest.doMock("next/navigation", () => ({
  ...jest.requireActual<typeof import("next/navigation")>("next/navigation"),
  useRouter: () => ({ refresh }),
}));
const { default: TaskEditLoader } = jest.requireActual<typeof import("@/components/task/editLoader")>(
  "@/components/task/editLoader",
);

beforeEach(() => {
  repository = createTaskRepository();
});

afterEach(() => {
  jest.restoreAllMocks();
  refresh.mockClear();
});

test("loads the selected task and prefills the edit form", async () => {
  repository.create({ title: "Outra tarefa", description: "Outros detalhes" });
  const task = repository.create({ title: "Revisar proposta", description: "Conferir detalhes" });
  render(await TaskEditLoader({ id: task.id }));

  expect(screen.getByRole("heading", { name: "Editar tarefa" })).toBeTruthy();
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: /Título/ }).value).toBe(task.title);
  expect(screen.getByRole<HTMLTextAreaElement>("textbox", { name: /Descrição/ }).value).toBe(task.description);
  expect(screen.getByRole("button", { name: "Salvar alterações" })).toBeTruthy();
});

test.each(["malformed", "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178"])(
  "uses the Next.js 404 for an invalid or missing task ID (%s)",
  async (id) => {
    await expect(TaskEditLoader({ id })).rejects.toMatchObject({
      digest: "NEXT_HTTP_ERROR_FALLBACK;404",
    });
  },
);

test("shows a retryable alert when the task lookup fails unexpectedly", async () => {
  jest.spyOn(console, "error").mockImplementation(() => {});
  jest.spyOn(repository, "getById").mockImplementation(() => {
    throw new Error("Private repository failure");
  });
  const id = "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178";
  render(await TaskEditLoader({ id }));

  const alert = screen.getByRole("alert");
  expect(alert.textContent).toContain("Não foi possível carregar a tarefa.");
  expect(alert.textContent).not.toContain("Private repository failure");
  expect(screen.queryByRole("button", { name: "Salvar alterações" })).toBeNull();
  fireEvent.click(within(alert).getByRole("button", { name: "Tentar novamente" }));
  expect(refresh).toHaveBeenCalledTimes(1);
});
