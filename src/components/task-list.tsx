"use client";

import {
  Alert,
  Box,
  Button,
  List,
  ListItem,
  Stack,
  Typography,
} from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Task, TaskCursor, TaskPage } from "../lib/tasks";
import { TaskDeleteDialog } from "./task-delete";
import { createTaskClient } from "../trpc/client";
import { TIMEOUTS } from "@/constants/global";

const taskListKey = ["task", "listPage"] as const;

export function TaskList({ firstPage }: { firstPage: TaskPage }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TaskListContent firstPage={firstPage} />
    </QueryClientProvider>
  );
}

function TaskListContent({ firstPage }: { firstPage: TaskPage }) {
  const [client] = useState(createTaskClient);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [deletedTitle, setDeletedTitle] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const focusListAfterDelete = useRef(false);

  useEffect(() => {
    if (!deletedTitle) return;

    const timeout = window.setTimeout(() => setDeletedTitle(null), TIMEOUTS.DELETE_NOTIFICATION);
    return () => window.clearTimeout(timeout);
  }, [deletedTitle]);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
    refetch,
  } = useInfiniteQuery({
    queryKey: taskListKey,
    queryFn: ({ pageParam, signal }: { pageParam: TaskCursor | null; signal: AbortSignal }) =>
      client.task.listPage.query({ cursor: pageParam ?? undefined }, { signal }),
    initialPageParam: null,
    getNextPageParam: (page) => page.nextCursor,
    initialData: { pages: [firstPage], pageParams: [null] },
    staleTime: 30_000,
    refetchOnMount: false,
    retry: false,
  });

  useEffect(() => {
    const target = sentinel.current;
    if (
      !target ||
      !hasNextPage ||
      isFetching ||
      isError ||
      selectedTask ||
      typeof IntersectionObserver === "undefined"
    ) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) void fetchNextPage({ cancelRefetch: false });
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isError, selectedTask, fetchNextPage]);

  const tasks = data.pages.flatMap((page) => page.tasks);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: "space-between", alignItems: "center" }}>
        <Typography component="h1" variant="h4" tabIndex={-1} ref={heading}>
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

      {tasks.length === 0 && !hasNextPage && !isError && (
        <Typography>Nenhuma tarefa cadastrada.</Typography>
      )}

      {tasks.length > 0 && (
        <List aria-label="Lista de tarefas" disablePadding>
          {tasks.map((task) => (
            <ListItem key={task.id} divider disableGutters>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{
                  width: "100%",
                  alignItems: { xs: "flex-start", sm: "center" },
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ minWidth: 0, maxWidth: "100%", overflowWrap: "anywhere" }}>
                  <Typography component="h2" variant="h6">{task.title}</Typography>
                  {task.description && (
                    <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>
                      {task.description}
                    </Typography>
                  )}
                </Box>
                <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                  <Button
                    component={Link}
                    href={`/tasks/${task.id}/edit`}
                    aria-label={`Editar tarefa: ${task.title}`}
                  >
                    Editar
                  </Button>
                  <Button
                    color="error"
                    aria-label={`Excluir tarefa: ${task.title}`}
                    onClick={() => {
                      setDeletedTitle(null);
                      setSelectedTask(task);
                    }}
                  >
                    Excluir
                  </Button>
                </Stack>
              </Stack>
            </ListItem>
          ))}
        </List>
      )}

      {isError && <Alert severity="error">Não foi possível carregar as tarefas.</Alert>}

      {(hasNextPage || isError) && (
        <Box ref={sentinel}>
          <Button
            variant="outlined"
            disabled={isFetching || Boolean(selectedTask)}
            onClick={() => {
              if (isError && !isFetchNextPageError) void refetch();
              else void fetchNextPage({ cancelRefetch: false });
            }}
          >
            {isFetchingNextPage ? "Carregando…" : isError ? "Tentar novamente" : "Carregar mais"}
          </Button>
        </Box>
      )}

      {selectedTask && (
        <TaskDeleteDialog
          task={selectedTask}
          deleteTask={(id) => client.task.delete.mutate({ id })}
          onClose={() => setSelectedTask(null)}
          onDeleted={(title) => {
            focusListAfterDelete.current = true;
            setSelectedTask(null);
            setDeletedTitle(title);
          }}
          onExited={() => {
            if (focusListAfterDelete.current) {
              focusListAfterDelete.current = false;
              heading.current?.focus();
            }
          }}
        />
      )}
    </Stack>
  );
}
