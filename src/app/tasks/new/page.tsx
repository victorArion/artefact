import Container from "@mui/material/Container";
import TaskForm from "@/components/task/form";

export default function NewTaskPage() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <TaskForm />
    </Container>
  );
}
