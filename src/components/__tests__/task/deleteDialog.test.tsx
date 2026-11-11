/** @jest-environment jsdom */

import { afterEach, beforeEach, describe, expect, jest, test } from "@jest/globals";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { Task, TaskPage } from "@/lib/tasks";
import TaskDeleteDialog from "@/components/task/deleteDialog";

const task: Task = {
  id: "b6c7f4ca-1d77-49c5-8d48-9a3e76a14178",
  title: "Review the proposal",
  description: "Check the latest changes.",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const otherTask: Task = {
  ...task,
  id: "d20823d5-6f04-40a8-b280-6cb78c511b77",
  title: "Keep this task",
};

const initialPage: TaskPage = {
  tasks: [task, otherTask],
  nextCursor: null,
};

describe("TaskDeleteDialog", () => {
  let queryClient: QueryClient;
  let onClose: () => void;
  let onDeleted: (title: string) => void;
  let onExited: () => void;
  let deleteTask: (id: string) => Promise<{ id: string }>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    queryClient.setQueryData(["task", "listPage"], {
      pages: [initialPage],
      pageParams: [null],
    });
    onClose = jest.fn();
    onDeleted = jest.fn();
    onExited = jest.fn();
    deleteTask = jest.fn<(id: string) => Promise<{ id: string }>>();
  });

  afterEach(() => {
    queryClient.clear();
  });

  function renderDialog() {
    return render(
      <QueryClientProvider client={queryClient}>
        <TaskDeleteDialog
          task={task}
          open
          deleteTask={deleteTask}
          onClose={onClose}
          onDeleted={onDeleted}
          onExited={onExited}
        />
      </QueryClientProvider>,
    );
  }

  test("shows the selected task and closes without deleting when canceled", () => {
    renderDialog();

    expect(screen.getByRole("dialog").textContent).toContain(task.title);
    fireEvent.click(screen.getByRole("button", { name: "Cancelar" }));

    expect(onClose).toHaveBeenCalledTimes(1);
    expect(deleteTask).not.toHaveBeenCalled();
  });

  test("deletes the task, updates cached pages, and reports success", async () => {
    jest.mocked(deleteTask).mockResolvedValue({ id: task.id });
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(task.title));
    expect(deleteTask).toHaveBeenCalledWith(task.id);
    expect(queryClient.getQueryData(["task", "listPage"])).toEqual({
      pages: [{ tasks: [otherTask], nextCursor: null }],
      pageParams: [null],
    });
  });

  test("keeps the dialog open and the cached task when deletion fails", async () => {
    jest.mocked(deleteTask).mockRejectedValue(new Error("Request failed"));
    renderDialog();

    fireEvent.click(screen.getByRole("button", { name: "Confirmar exclusão" }));

    expect((await screen.findByRole("alert")).textContent).toContain(
      "Não foi possível excluir a tarefa. Tente novamente.",
    );
    expect(screen.queryByRole("dialog")).not.toBeNull();
    expect(onDeleted).not.toHaveBeenCalled();
    expect(queryClient.getQueryData(["task", "listPage"])).toEqual({
      pages: [initialPage],
      pageParams: [null],
    });
  });
});
