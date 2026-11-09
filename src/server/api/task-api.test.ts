import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { randomUUID } from "node:crypto";
import { createTaskClient } from "../../trpc/client";
import { createTaskRepository } from "../repositories/task-repository";
import { appRouter } from "./root";

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
    expect(await client.task.list.query()).toEqual([]);

    const created = await client.task.create.mutate({ title: "  First task  " });
    expect(created).toMatchObject({ title: "First task", description: "" });
    expect(await client.task.list.query()).toEqual([created]);
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
    expect(await client.task.list.query()).toEqual([]);
  });

  test("rejects malformed IDs and invalid writes as bad requests", async () => {
    const created = await client.task.create.mutate({ title: "Original" });
    const badRequest = { data: { code: "BAD_REQUEST", httpStatus: 400 } };
    const createWithId = { title: "Invalid create", id: randomUUID() };
    const updateWithTimestamp = {
      id: created.id,
      changes: { title: "Invalid update", updatedAt: created.updatedAt },
    };

    await expect(client.task.getById.query({ id: "invalid" })).rejects.toMatchObject(badRequest);
    await expect(client.task.create.mutate({ title: "   " })).rejects.toMatchObject(badRequest);
    await expect(client.task.create.mutate(createWithId)).rejects.toMatchObject(badRequest);
    await expect(
      client.task.update.mutate({ id: created.id, changes: {} }),
    ).rejects.toMatchObject(badRequest);
    await expect(client.task.update.mutate(updateWithTimestamp)).rejects.toMatchObject(badRequest);
    expect(await client.task.list.query()).toEqual([created]);
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
    jest.spyOn(taskRepository, "list").mockImplementation(() => {
      throw new Error("Private repository error");
    });

    const response = await fetch("http://localhost/api/trpc/task.list");
    expect(response.status).toBe(500);
    const { error } = await response.json();
    expect(error.message).toBe("Internal server error.");
    expect(error.data).not.toHaveProperty("stack");
  });
});
