import "server-only";

import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { getTaskError } from "@/lib/taskErrors";
import { appRouter } from "@/server/api/root";
import { taskRepository } from "@/server/repositories/taskRepository";
import TaskForm from "./form";
import TaskLoadError from "./loadError";

export default async function TaskEditLoader({ id }: { id: string }) {
  const caller = appRouter.createCaller({ taskRepository });

  return caller.task.getById({ id }).then(
    (task) => {
      if (!task) notFound();
      return <TaskForm task={{ id: task.id, title: task.title, description: task.description }} />;
    },
    (error: unknown) => {
      if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) {
        notFound();
      }
      return <TaskLoadError message={getTaskError(error, "edit").message} />;
    },
  );
}
