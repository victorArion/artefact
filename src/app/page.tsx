import Container from "@mui/material/Container";
import { TaskList } from "../components/task-list";
import { appRouter } from "../server/api/root";
import { taskRepository } from "../server/repositories/task-repository";

export const dynamic = "force-dynamic";

export default async function Home() {
  const caller = appRouter.createCaller({ taskRepository });
  const firstPage = await caller.task.listPage({});

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <TaskList firstPage={firstPage} />
    </Container>
  );
}
