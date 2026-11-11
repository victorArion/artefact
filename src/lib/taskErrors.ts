import { TRPCClientError } from "@trpc/client";
import type { AppRouter } from "../server/api/root";

type Operation = "load" | "refresh" | "page" | "edit" | "save" | "delete";

const fallback: Record<Operation, string> = {
  load: "Não foi possível carregar as tarefas. Tente novamente.",
  refresh: "Não foi possível atualizar a lista de tarefas. Tente novamente.",
  page: "Não foi possível carregar mais tarefas. Tente novamente.",
  edit: "Não foi possível carregar a tarefa. Tente novamente.",
  save: "Não foi possível salvar a tarefa. Tente novamente.",
  delete: "Não foi possível excluir a tarefa. Tente novamente.",
};

export const taskNotFoundMessage = "Esta tarefa não existe ou já foi excluída.";

function asClientError(error: unknown) {
  return error instanceof TRPCClientError ? error as TRPCClientError<AppRouter> : undefined;
}

export function getTaskError(error: unknown, operation: Operation) {
  const clientError = asClientError(error);
  const code = clientError?.data?.code;
  const restart = operation === "page" && (code === "NOT_FOUND" || code === "BAD_REQUEST");

  if (restart) {
    return { message: "A lista mudou. Recarregue desde o início para continuar.", restart };
  }
  if (code === "NOT_FOUND") return { message: taskNotFoundMessage, restart };
  if (code === "BAD_REQUEST") {
    return { message: "Confira os dados e tente novamente.", restart };
  }
  if (clientError && !clientError.shape && clientError.cause instanceof TypeError) {
    return { message: "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.", restart };
  }
  return { message: fallback[operation], restart };
}

export function getTaskFieldErrors(error: unknown) {
  const data = asClientError(error)?.data;
  const fields = data && "validationFields" in data ? data.validationFields : undefined;
  return {
    title: fields?.includes("title") ? "Confira o título da tarefa." : undefined,
    description: fields?.includes("description") ? "Confira a descrição da tarefa." : undefined,
  };
}
