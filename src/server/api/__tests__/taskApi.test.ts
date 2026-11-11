import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { randomUUID } from "node:crypto";
import { createTaskClient } from "@/trpc/client";
import { createTaskRepository } from "@/server/repositories/taskRepository";
import { appRouter } from "@/server/api/root";

describe("task API", () => {
  let taskRepository: ReturnType<typeof createTaskRepository>;
  let client: ReturnType<typeof createTaskClient>;

  beforeEach(() => {
    taskRepository = createTaskRepository();
    jest.spyOn(globalThis, "fetch").mockImplementation((input, init) =>
      fetchRequestHandler({
        endpoint: "/api/trpc",
        req: new Request(input, init),
        router: appRouter,
        createContext: () => ({ taskRepository }),
      }),
    );
    client = createTaskClient("http://localhost/api/trpc");
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates, lists, reads, updates, and deletes across requests", async () => {
    expect((await client.task.listPage.query({})).tasks).toEqual([]);

    const created = await client.task.create.mutate({
      title: "  First task  ",
      description: "Details",
    });
    expect(created).toMatchObject({ title: "First task", description: "Details" });
    expect((await client.task.listPage.query({})).tasks).toEqual([created]);
    expect(await client.task.getById.query({ id: created.id })).toEqual(created);

    const updated = await client.task.update.mutate({
      id: created.id,
      changes: { description: "New details" },
    });
    expect(updated).toMatchObject({
      id: created.id,
      title: created.title,
      description: "New details",
      createdAt: created.createdAt,
    });
    expect(await client.task.getById.query({ id: created.id })).toEqual(updated);

    expect(await client.task.delete.mutate({ id: created.id })).toEqual({ id: created.id });
    expect((await client.task.listPage.query({})).tasks).toEqual([]);
  });

  test("paginates by creation time and ID after the cursor task is deleted", async () => {
    const timestamp = "2026-01-02T00:00:00.000Z";
    const ids = Array.from({ length: 12 }, () => randomUUID()).sort();
    taskRepository = createTaskRepository(
      ids.map((id, index) => ({
        id,
        title: `Task ${index}`,
        description: "",
        createdAt: index === 0 ? "2026-01-01T00:00:00.000Z" : timestamp,
        updatedAt: timestamp,
      })).reverse(),
    );

    const first = await client.task.listPage.query({});
    expect(first.tasks.map(({ id }) => id)).toEqual(ids.slice(1, 11));
    expect(first.nextCursor).toBe(ids[10]);
    if (!first.nextCursor) throw new Error("Expected another page");

    const next = await client.task.listPage.query({ cursor: first.nextCursor });
    await client.task.delete.mutate({ id: first.nextCursor });
    const second = await client.task.listPage.query({ cursor: first.nextCursor });
    expect(second.tasks.map(({ id }) => id)).toEqual([ids[11], ids[0]]);
    expect(second.nextCursor).toBeNull();
    expect(second).toEqual(next);
  });

  test("returns no cursor for empty lists and rejects invalid or unknown cursors", async () => {
    expect(await client.task.listPage.query({})).toEqual({ tasks: [], nextCursor: null });
    await expect(
      client.task.listPage.query({ cursor: "invalid" }),
    ).rejects.toMatchObject({ data: { code: "BAD_REQUEST" } });
    await expect(
      client.task.listPage.query({ cursor: randomUUID() }),
    ).rejects.toMatchObject({ data: { code: "NOT_FOUND" } });
  });

  test("rejects malformed IDs and invalid writes as bad requests", async () => {
    const created = await client.task.create.mutate({ title: "Original", description: "Details" });
    const badRequest = { data: { code: "BAD_REQUEST", httpStatus: 400 } };
    const createWithId = { title: "Invalid create", description: "Details", id: randomUUID() };
    const updateWithTimestamp = {
      id: created.id,
      changes: { title: "Invalid update", updatedAt: created.updatedAt },
    };

    await expect(client.task.getById.query({ id: "invalid" })).rejects.toMatchObject(badRequest);
    await expect(
      client.task.create.mutate({ title: "   ", description: "Details" }),
    ).rejects.toMatchObject(badRequest);
    await expect(
      client.task.create.mutate({ title: "Valid title", description: " " }),
    ).rejects.toMatchObject(badRequest);
    const missingDescription = await fetch("http://localhost/api/trpc/task.create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Missing description" }),
    });
    expect(missingDescription.status).toBe(400);
    await expect(client.task.create.mutate(createWithId)).rejects.toMatchObject(badRequest);
    await expect(
      client.task.update.mutate({ id: created.id, changes: {} }),
    ).rejects.toMatchObject(badRequest);
    await expect(
      client.task.update.mutate({ id: created.id, changes: { description: "" } }),
    ).rejects.toMatchObject({
      message: "Invalid input.",
      data: { ...badRequest.data, validationFields: ["description"] },
    });
    await expect(client.task.update.mutate(updateWithTimestamp)).rejects.toMatchObject(badRequest);
    expect((await client.task.listPage.query({})).tasks).toEqual([created]);
  });

  test("reports missing tasks for lookup, update, and delete", async () => {
    const id = randomUUID();
    const notFound = { data: { code: "NOT_FOUND", httpStatus: 404 } };

    await expect(client.task.getById.query({ id })).rejects.toMatchObject(notFound);
    await expect(
      client.task.update.mutate({ id, changes: { title: "Missing" } }),
    ).rejects.toMatchObject(notFound);
    await expect(client.task.delete.mutate({ id })).rejects.toMatchObject(notFound);
  });

  test("hides details of unexpected server errors", async () => {
    const log = jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(taskRepository, "listPage").mockImplementation(() => {
      throw new TypeError("Private repository error\n    at /private-task-data.ts:1:1");
    });

    const error = await client.task.listPage.query({}).catch((error: unknown) => error);
    expect(error).toMatchObject({
      message: "Internal server error.",
      data: { code: "INTERNAL_SERVER_ERROR", httpStatus: 500 },
    });
    expect(error).not.toHaveProperty("data.stack");
    expect(log.mock.calls).toEqual([[
      "Task procedure failed",
      {
        path: "task.listPage",
        type: "query",
        code: "INTERNAL_SERVER_ERROR",
        causeType: "TypeError",
        stackFrames: expect.arrayContaining([
          expect.stringMatching(/taskApi\.test\.ts:\d+:\d+$/),
        ]),
      },
    ]]);
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/Private repository error|private-task-data/);
  });
});
