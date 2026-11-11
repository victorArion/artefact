/** @jest-environment jsdom */

import { expect, test } from "@jest/globals";
import { render, screen } from "@testing-library/react";
import EditTaskNotFound from "@/app/tasks/[id]/edit/not-found";

test("explains that the task is missing and links back to the task list", () => {
  render(<EditTaskNotFound />);

  expect(screen.getByRole("heading", { name: "Tarefa não encontrada" })).toBeTruthy();
  expect(screen.getByRole("alert").textContent).toContain("Esta tarefa não existe ou já foi excluída.");
  expect(screen.getByRole("link", { name: "Voltar para tarefas" }).getAttribute("href")).toBe("/");
});
