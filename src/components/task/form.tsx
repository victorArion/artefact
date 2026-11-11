"use client";

import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  createTaskSchema,
  TASK_DESCRIPTION_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  type Task,
} from "../../lib/tasks";
import { createTaskClient } from "../../trpc/client";
import { getTaskError, getTaskFieldErrors } from "../../lib/taskErrors";
import { taskListKey } from "@/trpc/queryKeys";

type TaskFormProps = {
  task?: Pick<Task, "id" | "title" | "description">;
};

export default function TaskForm({ task }: TaskFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [client] = useState(createTaskClient);
  const saveTask = useMutation({
    mutationFn: ({ title, description }: { title: string; description: string }) =>
      task
        ? client.task.update.mutate({ id: task.id, changes: { title, description } })
        : client.task.create.mutate({ title, description }),
  });
  const [title, setTitle] = useState(task?.title ?? "");
  const [description, setDescription] = useState(task?.description ?? "");
  const [errors, setErrors] = useState<{ title?: string; description?: string }>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const isSaving = saveTask.isPending;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;

    setSaveError(null);
    const result = createTaskSchema.safeParse({ title, description });
    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;
      setErrors({
        title: fieldErrors.title
          ? title.trim()
            ? `Use até ${TASK_TITLE_MAX_LENGTH} caracteres no título.`
            : "Informe o título da tarefa."
          : undefined,
        description: fieldErrors.description
          ? description.trim()
            ? `Use até ${TASK_DESCRIPTION_MAX_LENGTH} caracteres na descrição.`
            : "Informe a descrição da tarefa."
          : undefined,
      });
      return;
    }

    setErrors({});
    try {
      await saveTask.mutateAsync(result.data);
    } catch (error) {
      const fields = getTaskFieldErrors(error);
      if (fields.title || fields.description) setErrors(fields);
      else setSaveError(getTaskError(error, "save").message);
      return;
    }

    void queryClient.invalidateQueries({ queryKey: taskListKey, exact: true });
    router.replace("/", { scroll: false });
    router.refresh();
  }

  return (
    <Stack component="form" spacing={2} onSubmit={handleSubmit} noValidate>
      <Typography component="h1" variant="h4">
        {task ? "Editar tarefa" : "Nova tarefa"}
      </Typography>

      {saveError && (
        <Alert severity="error">{saveError}</Alert>
      )}

      <TextField
        id="task-title"
        name="title"
        label="Título"
        required
        value={title}
        disabled={isSaving}
        error={Boolean(errors.title)}
        helperText={errors.title}
        onChange={(event) => {
          setTitle(event.target.value);
          setErrors((current) => ({ ...current, title: undefined }));
        }}
        slotProps={{ htmlInput: { maxLength: TASK_TITLE_MAX_LENGTH } }}
      />
      <TextField
        id="task-description"
        name="description"
        label="Descrição"
        required
        multiline
        rows={4}
        slotProps={{ htmlInput: { maxLength: TASK_DESCRIPTION_MAX_LENGTH } }}
        value={description}
        disabled={isSaving}
        error={Boolean(errors.description)}
        helperText={errors.description}
        onChange={(event) => {
          setDescription(event.target.value);
          setErrors((current) => ({ ...current, description: undefined }));
        }}
      />

      <Stack direction="row" spacing={1} sx={{ justifyContent: "flex-end" }}>
        {isSaving ? (
          <Button disabled>Cancelar</Button>
        ) : (
          <Button component={Link} href="/" scroll={false}>Cancelar</Button>
        )}
        <Button type="submit" variant="contained" disabled={isSaving}>
          {isSaving ? "Salvando…" : task ? "Salvar alterações" : "Criar tarefa"}
        </Button>
      </Stack>
    </Stack>
  );
}
