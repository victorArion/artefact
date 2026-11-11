import Container from "@mui/material/Container";
import TaskListLoader from "@/components/task/listLoader";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <TaskListLoader />
    </Container>
  );
}
