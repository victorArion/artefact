import "server-only";

import { getTaskError } from "@/lib/taskErrors";
import { appRouter } from "@/server/api/root";
import { taskRepository } from "@/server/repositories/taskRepository";
import TaskLoadError from "./loadError";
import TaskPage from "./page";

export default async function TaskListLoader() {
  const caller = appRouter.createCaller({ taskRepository });
  
  return caller.task.listPage({})
    .then((firstPage) => <TaskPage firstPage={firstPage} />)
    .catch((error: unknown) => (
      <TaskLoadError message={getTaskError(error, "load").message} />
    ));
}
