"use client";

import { Alert, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function TaskLoadError({
  message,
  reset,
}: {
  message: string;
  reset?: () => void;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <Alert severity="error" action={
      <Button color="inherit" disabled={pending} onClick={() => {
        startTransition(() => {
          router.refresh();
          reset?.();
        });
      }}>
        {pending ? "Carregando…" : "Tentar novamente"}
      </Button>
    }>
      {message}
    </Alert>
  );
}
