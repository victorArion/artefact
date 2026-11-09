import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { ZodError } from "zod";
import { createTaskRepository } from "./task-repository";

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
    expect(repository.list()).toEqual([]);

    const first = repository.create({ title: "  First task  " });
    const second = repository.create({ title: "Second task", description: "Details" });

    expect(first).toEqual({
      id: expect.stringMatching(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
      ),
      title: "First task",
      description: "",
      createdAt,
      updatedAt: createdAt,
    });
    expect(second.id).not.toBe(first.id);
    expect(repository.getById(second.id)).toEqual(second);
    expect(createTaskRepository().list()).toEqual([]);
  });

  test.each([
    { title: "   " },
    { title: "a".repeat(121) },
    { title: "Valid title", description: "a".repeat(5_001) },
    { title: "Valid title", id: "client-supplied" },
    { title: "Valid title", createdAt },
  ])("rejects invalid create input %#", (input) => {
    expect(() => repository.create(input)).toThrow(ZodError);
    expect(repository.list()).toEqual([]);
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
    expect(repository.update(original.id, { description: "" })).toEqual({
      ...original,
      title: "Revised",
      description: "",
      updatedAt,
    });
  });

  test.each([
    {},
    { title: undefined },
    { title: " " },
    { description: "a".repeat(5_001) },
    { title: "Revised", updatedAt },
    { title: "Revised", status: "done" },
  ])("rejects invalid updates without changing stored data %#", (input) => {
    const task = repository.create({ title: "Original" });
    jest.setSystemTime(new Date(updatedAt));

    expect(() => repository.update(task.id, input)).toThrow(ZodError);
    expect(repository.getById(task.id)).toEqual(task);
  });

  test("handles missing IDs and removes existing tasks", () => {
    expect(repository.getById("missing")).toBeUndefined();
    expect(repository.update("missing", { title: "Revised" })).toBeUndefined();
    expect(repository.delete("missing")).toBe(false);

    const task = repository.create({ title: "Remove me" });
    expect(repository.delete(task.id)).toBe(true);
    expect(repository.delete(task.id)).toBe(false);
    expect(repository.getById(task.id)).toBeUndefined();
    expect(repository.list()).toEqual([]);
  });

  test("lists newest tasks first with an ascending ID tie-break", () => {
    const first = repository.create({ title: "First" });
    const second = repository.create({ title: "Second" });
    jest.setSystemTime(new Date(updatedAt));
    const newest = repository.create({ title: "Newest" });
    repository.update(first.id, { title: "Renamed" });

    expect(repository.list().map(({ id }) => id)).toEqual([
      newest.id,
      ...[first.id, second.id].sort(),
    ]);
  });

  test("returns independent records from reads and writes", () => {
    const created = repository.create({ title: "Original" });
    created.title = "Changed outside the repository";
    expect(repository.getById(created.id)?.title).toBe("Original");

    const updated = repository.update(created.id, { title: "Revised" });
    const read = repository.getById(created.id);
    const [listed] = repository.list();
    if (!updated || !read) throw new Error("Expected the task to exist");

    updated.title = "Changed update result";
    read.title = "Changed lookup result";
    listed.title = "Changed list result";

    expect(repository.getById(created.id)?.title).toBe("Revised");
  });
});
