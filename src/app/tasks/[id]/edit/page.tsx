import Container from "@mui/material/Container";
import { TRPCError } from "@trpc/server";
import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { appRouter } from "@/server/api/root";
import { taskRepository } from "@/server/repositories/task-repository";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const caller = appRouter.createCaller({ taskRepository });
  const task = await caller.task.getById({ id }).catch((error: unknown) => {
    if (error instanceof TRPCError && (error.code === "NOT_FOUND" || error.code === "BAD_REQUEST")) {
      notFound();
    }
    throw error;
  });

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <TaskForm task={{ id: task.id, title: task.title, description: task.description }} />
    </Container>
  );
}
