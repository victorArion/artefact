import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ZodError } from "zod";
import { createTaskRepository } from "../taskRepository";

const createdAt = "2026-01-01T00:00:00.000Z";
const updatedAt = "2026-01-02T00:00:00.000Z";

describe("task repository", () => {
  let repository: ReturnType<typeof createTaskRepository>;

  beforeEach(() => {
    jest.useFakeTimers({ now: new Date(createdAt) });
    repository = createTaskRepository();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test("starts empty and creates tasks with generated UUIDs and timestamps", () => {
    expect(repository.listPage()?.tasks).toEqual([]);

    const first = repository.create({ title: "  First task  ", description: "  First details  " });
    const second = repository.create({ title: "Second task", description: "Details" });

    expect(first).toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
      title: "First task",
      description: "  First details  ",
      createdAt,
      updatedAt: createdAt,
    });
    expect(second.id).not.toBe(first.id);
    expect(repository.getById(second.id)).toEqual(second);
    expect(createTaskRepository().listPage()?.tasks).toEqual([]);
  });

  test.each([
    { title: "   ", description: "Details" },
    { title: "a".repeat(121), description: "Details" },
    { title: "Valid title", description: "" },
    { title: "Valid title", description: " \n " },
    { title: "Valid title", description: "a".repeat(5_001) },
    { title: "Valid title", description: "Details", id: "client-supplied" },
    { title: "Valid title", description: "Details", createdAt },
  ])("rejects invalid create input %#", (input) => {
    expect(() => repository.create(input)).toThrow(ZodError);
    expect(repository.listPage()?.tasks).toEqual([]);
  });

  test("accepts titles and descriptions at the length limits", () => {
    const title = "a".repeat(120);
    const description = "a".repeat(5_000);
    expect(repository.create({ title: ` ${title} `, description })).toMatchObject({
      title,
      description,
    });
  });

  test("updates only supplied fields and preserves the ID and creation time", () => {
    const original = repository.create({ title: "Original", description: "Details" });
    jest.setSystemTime(new Date(updatedAt));

    const renamed = repository.update(original.id, { title: "  Revised  " });
    expect(renamed).toEqual({ ...original, title: "Revised", updatedAt });
    expect(repository.update(original.id, { description: "New details" })).toEqual({
      ...original,
      title: "Revised",
      description: "New details",
      updatedAt,
    });
  });

  test.each([
    {},
    { title: undefined },
    { title: " " },
    { description: "" },
    { description: " \n " },
    { description: "a".repeat(5_001) },
    { title: "Revised", updatedAt },
    { title: "Revised", status: "done" },
  ])("rejects invalid updates without changing stored data %#", (input) => {
    const task = repository.create({ title: "Original", description: "Details" });
    jest.setSystemTime(new Date(updatedAt));

    expect(() => repository.update(task.id, input)).toThrow(ZodError);
    expect(repository.getById(task.id)).toEqual(task);
  });

  test("handles missing IDs and removes existing tasks", () => {
    expect(repository.getById("missing")).toBeUndefined();
    expect(repository.update("missing", { title: "Revised" })).toBeUndefined();
    expect(repository.delete("missing")).toBe(false);

    const task = repository.create({ title: "Remove me", description: "Details" });
    expect(repository.delete(task.id)).toBe(true);
    expect(repository.delete(task.id)).toBe(false);
    expect(repository.getById(task.id)).toBeUndefined();
    expect(repository.listPage()?.tasks).toEqual([]);
  });

  test("returns the first page newest first with an ascending ID tie-break", () => {
    const first = repository.create({ title: "First", description: "Details" });
    const second = repository.create({ title: "Second", description: "Details" });
    jest.setSystemTime(new Date(updatedAt));
    const newest = repository.create({ title: "Newest", description: "Details" });
    repository.update(first.id, { title: "Renamed" });

    expect(repository.listPage()?.tasks.map(({ id }) => id)).toEqual([
      newest.id,
      ...[first.id, second.id].sort(),
    ]);
  });

  test("returns independent records from reads and writes", () => {
    const created = repository.create({ title: "Original", description: "Details" });
    created.title = "Changed outside the repository";
    expect(repository.getById(created.id)?.title).toBe("Original");

    const updated = repository.update(created.id, { title: "Revised" });
    const read = repository.getById(created.id);
    const [listed] = repository.listPage()?.tasks ?? [];
    if (!updated || !read) throw new Error("Expected the task to exist");

    updated.title = "Changed update result";
    read.title = "Changed lookup result";
    listed.title = "Changed list result";

    expect(repository.getById(created.id)?.title).toBe("Revised");
  });
});
