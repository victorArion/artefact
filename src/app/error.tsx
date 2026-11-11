"use client";

import Container from "@mui/material/Container";
import TaskLoadError from "@/components/task/loadError";

export default function AppError({ reset }: { reset: () => void }) {
  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <TaskLoadError message="Não foi possível exibir a página." reset={reset} />
    </Container>
  );
}
