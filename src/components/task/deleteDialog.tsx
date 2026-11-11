"use client";

import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  useMutation,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";
import type { Task, TaskCursor, TaskPage } from "../../lib/tasks";
import { getTaskError } from "../../lib/taskErrors";

const taskListKey = ["task", "listPage"] as const;

type TaskDeleteDialogProps = {
  task: Task;
  deleteTask: (id: string) => Promise<{ id: string }>;
  onClose: () => void;
  onDeleted: (title: string) => void;
  onExited: () => void;
};

export default function TaskDeleteDialog({
  task,
  deleteTask,
  onClose,
  onDeleted,
  onExited,
}: TaskDeleteDialogProps) {
  const queryClient = useQueryClient();

  const deletion = useMutation({
    mutationFn: () => deleteTask(task.id),
    onSuccess: async () => {
      await queryClient.cancelQueries({ queryKey: taskListKey });
      queryClient.setQueryData<InfiniteData<TaskPage, TaskCursor | null>>(
        taskListKey,
        (current) =>
          current && {
            ...current,
            pages: current.pages.map((page) => ({
              ...page,
              tasks: page.tasks.filter((item) => item.id !== task.id),
            })),
          },
      );
      onDeleted(task.title);
      void queryClient.invalidateQueries({ queryKey: taskListKey });
    },
  });

  return (
    <Dialog
      open
      aria-labelledby="delete-task-title"
      aria-describedby="delete-task-description"
      onClose={() => {
        if (!deletion.isPending) onClose();
      }}
      slotProps={{ transition: { onExited } }}
    >
      <DialogTitle id="delete-task-title">Excluir tarefa?</DialogTitle>
      <DialogContent>
        <DialogContentText id="delete-task-description" sx={{ overflowWrap: "anywhere" }}>
          Deseja excluir “{task.title}”?
        </DialogContentText>
        {deletion.isError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {getTaskError(deletion.error, "delete").message}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button autoFocus disabled={deletion.isPending} onClick={onClose}>
          Cancelar
        </Button>
        <Button
          color="error"
          disabled={deletion.isPending}
          onClick={() => deletion.mutate()}
        >
          {deletion.isPending ? "Excluindo…" : "Confirmar exclusão"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
