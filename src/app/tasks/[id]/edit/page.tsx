import Container from "@mui/material/Container";
import TaskEditLoader from "@/components/task/editLoader";

export const dynamic = "force-dynamic";

export default async function EditTaskPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <TaskEditLoader id={id} />
    </Container>
  );
}
