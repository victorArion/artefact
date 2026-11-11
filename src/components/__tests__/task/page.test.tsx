/** @jest-environment jsdom */
import { afterEach, expect, jest, test } from "@jest/globals";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import type { TaskPage } from "@/lib/tasks";
import type { createTaskClient as clientFactory } from "@/trpc/client";
import QueryProvider from "@/trpc/queryProvider";

type Client = ReturnType<typeof clientFactory>;
const query = jest.fn<Client["task"]["listPage"]["query"]>();
const createTaskClient = jest.fn<() => { task: Partial<Client["task"]> }>();
jest.doMock("@/trpc/client", () => ({ createTaskClient }));
const { default: TaskPageComponent } = jest.requireActual<typeof import("@/components/task/page")>("@/components/task/page");
const firstPage: TaskPage = { tasks: [{ id: "f4ade6a1-5d63-4b7c-b65e-1da98f95153d", title: "SSR task", description: "Rendered immediately", createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z" }], nextCursor: null };
afterEach(() => {
  cleanup();
  jest.restoreAllMocks();
  jest.resetAllMocks();
});

test("composes the heading, create action, and initial task list", () => {
  createTaskClient.mockReturnValue({ task: { listPage: { query } } });
  render(<QueryProvider><TaskPageComponent firstPage={firstPage} /></QueryProvider>);
  expect(screen.getByRole("heading", { name: "Tarefas" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Nova tarefa" }).getAttribute("href")).toBe("/tasks/new");
  expect(screen.getByRole("heading", { name: "SSR task" })).toBeTruthy();
});

test("restores loaded pages, the next cursor and scroll after returning to the list", async () => {
  const first = firstPage.tasks[0];
  const second = { ...first, id: "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178", title: "Second page" };
  const third = { ...first, id: "d20823d5-6f04-40a8-b280-6cb78c511b77", title: "Third page" };
  query
    .mockResolvedValueOnce({ tasks: [second], nextCursor: second.id })
    .mockResolvedValueOnce({ tasks: [third], nextCursor: null });
  createTaskClient.mockReturnValue({ task: { listPage: { query } } });

  let frame: FrameRequestCallback | undefined;
  const scrollY = jest.replaceProperty(window, "scrollY", 0);
  jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
    frame = callback;
    return 1;
  });
  const scrollTo = jest.spyOn(window, "scrollTo").mockImplementation(() => {});
  const firstWithCursor = { tasks: [first], nextCursor: first.id };
  const { rerender } = render(<QueryProvider><TaskPageComponent firstPage={firstWithCursor} /></QueryProvider>);
  act(() => frame?.(0));

  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByRole("heading", { name: second.title })).toBeTruthy();
  scrollY.replaceValue(480);
  fireEvent.scroll(window);

  rerender(<QueryProvider><p>Another route</p></QueryProvider>);
  scrollY.replaceValue(0);
  fireEvent.scroll(window);
  rerender(<QueryProvider><TaskPageComponent firstPage={firstWithCursor} /></QueryProvider>);
  act(() => frame?.(0));

  expect(screen.getByRole("heading", { name: first.title })).toBeTruthy();
  expect(screen.getByRole("heading", { name: second.title })).toBeTruthy();
  expect(scrollTo.mock.calls).toEqual([[{ top: 480, behavior: "instant" }]]);
  expect(query).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: "Carregar mais" }));
  expect(await screen.findByRole("heading", { name: third.title })).toBeTruthy();
  expect(query.mock.calls.map(([input]) => input.cursor)).toEqual([first.id, second.id]);
});
