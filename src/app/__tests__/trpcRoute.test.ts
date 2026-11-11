import { beforeEach, expect, jest, test } from "@jest/globals";
import { createTaskRepository } from "@/server/repositories/taskRepository";

const endpoint = "http://localhost/api/trpc";
let repository: ReturnType<typeof createTaskRepository>;

jest.doMock("@/server/repositories/taskRepository", () => ({
  get taskRepository() { return repository; },
}));
const { GET, POST } = jest.requireActual<typeof import("@/app/api/trpc/[trpc]/route")>(
  "@/app/api/trpc/[trpc]/route",
);

beforeEach(() => {
  repository = createTaskRepository();
});

test("accepts a POST mutation and returns the created task on the next GET", async () => {
  const input = { title: "Tarefa via HTTP", description: "Criada pelo handler" };
  const created = await POST(new Request(`${endpoint}/task.create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  }));

  expect(created.status).toBe(200);
  expect(created.headers.get("Cache-Control")).toBe("no-store");
  const { result: { data: task } } = await created.json();
  expect(task).toMatchObject({ ...input, id: expect.any(String) });

  const url = new URL(`${endpoint}/task.listPage`);
  url.searchParams.set("input", "{}");
  const listed = await GET(new Request(url));
  expect(listed.status).toBe(200);
  expect(listed.headers.get("Cache-Control")).toBe("no-store");
  expect(await listed.json()).toMatchObject({
    result: { data: { tasks: [task], nextCursor: null } },
  });
});

test("returns a non-cacheable 404 for an unknown procedure", async () => {
  const response = await GET(new Request(`${endpoint}/task.unknown`));

  expect(response.status).toBe(404);
  expect(response.headers.get("Cache-Control")).toBe("no-store");
  expect(await response.json()).toMatchObject({ error: { data: { code: "NOT_FOUND" } } });
});
