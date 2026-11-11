"use client";

import { Alert, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { TIMEOUTS } from "@/constants/global";
import { useTaskListScrollRestoration } from "@/trpc/queryProvider";
import type { TaskPage } from "../../lib/tasks";
import TaskList from "./list";

export default function TaskPage({ firstPage }: { firstPage: TaskPage }) {
  const [deletedTitle, setDeletedTitle] = useState<string | null>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useTaskListScrollRestoration();

  useEffect(() => {
    if (!deletedTitle) return;

    const timeout = window.setTimeout(() => setDeletedTitle(null), TIMEOUTS.DELETE_NOTIFICATION);
    return () => window.clearTimeout(timeout);
  }, [deletedTitle]);

  return (
    <Stack spacing={2}>
      <Stack
        direction="row"
        spacing={2}
        sx={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <Typography component="h1" variant="h4" tabIndex={-1} ref={headingRef}>
          Tarefas
        </Typography>
        <Button component={Link} href="/tasks/new" variant="contained">
          Nova tarefa
        </Button>
      </Stack>

      {deletedTitle && (
        <Alert severity="success" role="status">
          Tarefa “{deletedTitle}” excluída.
        </Alert>
      )}

      <TaskList
        firstPage={firstPage}
        headingRef={headingRef}
        onTaskDeleted={setDeletedTitle}
      />
    </Stack>
  );
}
