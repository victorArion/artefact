import { afterEach, expect, jest, test } from "@jest/globals";
import { PassThrough } from "node:stream";
import { text } from "node:stream/consumers";
import { renderToPipeableStream } from "react-dom/server";
import { createTaskRepository } from "@/server/repositories/taskRepository";
import QueryProvider from "@/trpc/queryProvider";

let repository: ReturnType<typeof createTaskRepository>;
jest.doMock("@/server/repositories/taskRepository", () => ({
  get taskRepository() { return repository; },
}));
const { default: Home } = jest.requireActual<typeof import("@/app/page")>("@/app/page");

afterEach(() => {
  jest.restoreAllMocks();
});

test("renders the first page of tasks from the server in the main landmark", async () => {
  repository = createTaskRepository();
  repository.create({ title: "Tarefa renderizada no servidor", description: "Primeira página" });
  const listPage = jest.spyOn(repository, "listPage");
  const output = new PassThrough();
  const html = text(output);
  const { pipe } = renderToPipeableStream(<QueryProvider><Home /></QueryProvider>, {
    onAllReady: () => pipe(output),
    onError: (error) => {
      output.destroy(error instanceof Error ? error : new Error(String(error)));
    },
  });

  const markup = await html;
  expect(markup).toMatch(/<main\b/);
  expect(markup).toContain("Tarefa renderizada no servidor");
  expect(markup).toContain("Primeira página");
  expect(listPage).toHaveBeenCalledTimes(1);
  expect(listPage).toHaveBeenCalledWith(undefined);
});
