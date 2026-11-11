import { Alert, Button, Container, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { taskNotFoundMessage } from "@/lib/taskErrors";

export default function EditTaskNotFound() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 4 }}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h1" variant="h4">Tarefa não encontrada</Typography>
        <Alert severity="warning">{taskNotFoundMessage}</Alert>
        <Button component={Link} href="/">Voltar para tarefas</Button>
      </Stack>
    </Container>
  );
}
