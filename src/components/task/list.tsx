"use client";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  useInfiniteQuery,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef, useState, type RefObject } from "react";
import type { Task, TaskCursor, TaskPage } from "../../lib/tasks";
import { getTaskError } from "../../lib/taskErrors";
import TaskDeleteDialog from "./deleteDialog";
import { createTaskClient } from "../../trpc/client";

const taskListKey = ["task", "listPage"] as const;

type TaskListProps = {
  firstPage: TaskPage;
  headingRef: RefObject<HTMLHeadingElement | null>;
  onTaskDeleted: (title: string) => void;
};

export default function TaskList({ firstPage, headingRef, onTaskDeleted }: TaskListProps) {
  const [client] = useState(createTaskClient);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const focusListAfterDelete = useRef(false);

  const {
    data,
    error,
    fetchNextPage,
    hasNextPage,
    isError,
    isFetching,
    isFetchNextPageError,
    isRefetchError,
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
  const failure = isError
    ? getTaskError(error, isFetchNextPageError ? "page" : isRefetchError ? "refresh" : "load")
    : null;

  return (
    <Stack spacing={2}>
      {tasks.length === 0 && !hasNextPage && !isError && (
        <Typography>Nenhuma tarefa cadastrada.</Typography>
      )}

      {tasks.length > 0 && (
        <List aria-label="Lista de tarefas" disablePadding>
          {tasks.map((task) => (
            <ListItem key={task.id} disableGutters sx={{ pb: 2 }}>
              <Card variant="outlined" sx={{ width: "100%" }}>
                <CardContent>
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
                        <Tooltip title={task.description} arrow placement="top-start">
                          <Typography
                            tabIndex={0}
                            color="text.secondary"
                            sx={{
                              whiteSpace: "pre-wrap",
                              overflow: "hidden",
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 3,
                              cursor: "help",
                            }}
                          >
                            {task.description}
                          </Typography>
                        </Tooltip>
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
                          setSelectedTask(task);
                        }}
                      >
                        Excluir
                      </Button>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </ListItem>
          ))}
        </List>
      )}

      {failure && <Alert severity="error">{failure.message}</Alert>}

      {(hasNextPage || isError) && (
        <Box ref={sentinel}>
          <Button
            variant="outlined"
            disabled={isFetching || Boolean(selectedTask)}
            onClick={() => {
              if (failure?.restart || (isError && !isFetchNextPageError)) {
                // Infinite-query refetch starts at the first page and rebuilds the cursors.
                void refetch({ cancelRefetch: false });
              }
              else void fetchNextPage({ cancelRefetch: false });
            }}
          >
            {isFetching
              ? "Carregando…"
              : failure?.restart ? "Recarregar lista" : failure ? "Tentar novamente" : "Carregar mais"}
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
            onTaskDeleted(title);
          }}
          onExited={() => {
            if (focusListAfterDelete.current) {
              focusListAfterDelete.current = false;
              headingRef.current?.focus();
            }
          }}
        />
      )}
    </Stack>
  );
}
