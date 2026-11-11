/** @jest-environment jsdom */

import { expect, jest, test } from "@jest/globals";
import { render, screen, within } from "@testing-library/react";
import QueryProvider from "@/trpc/queryProvider";

jest.doMock("next/navigation", () => ({ useRouter: () => ({}) }));
const { default: NewTaskPage } = jest.requireActual<typeof import("@/app/tasks/new/page")>(
  "@/app/tasks/new/page",
);

test("renders a blank task creation form with a way back to the list", () => {
  render(<QueryProvider><NewTaskPage /></QueryProvider>);
  const page = within(screen.getByRole("main"));

  expect(page.getByRole("heading", { name: "Nova tarefa" })).toBeTruthy();
  expect(page.getByRole<HTMLInputElement>("textbox", { name: /Título/ }).value).toBe("");
  expect(page.getByRole<HTMLTextAreaElement>("textbox", { name: /Descrição/ }).value).toBe("");
  expect(page.getByRole("button", { name: "Criar tarefa" })).toBeTruthy();
  expect(page.getByRole("link", { name: "Cancelar" }).getAttribute("href")).toBe("/");
});
