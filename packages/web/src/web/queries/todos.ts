import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";
import type { AppRouterClient } from "../../api";

export type Todo = Awaited<ReturnType<AppRouterClient["todos"]["list"]>>[number];
export type Status = Todo["status"];

export function useTodos(listId: string) {
  return useQuery(orpc.todos.list.queryOptions({ input: { listId }, refetchInterval: 4000 }));
}
export function useActivity(listId: string, todoId?: string) {
  return useQuery(
    orpc.todos.activity.queryOptions({ input: { listId, todoId, limit: todoId ? 30 : 40 }, refetchInterval: 5000 }),
  );
}

function useListKeys(listId: string) {
  const qc = useQueryClient();
  const key = orpc.todos.list.queryOptions({ input: { listId } }).queryKey;
  const settle = () => {
    qc.invalidateQueries({ queryKey: key });
    qc.invalidateQueries({ queryKey: orpc.todos.activity.key() });
    qc.invalidateQueries({ queryKey: orpc.lists.mine.key() });
  };
  return { qc, key, settle };
}

export function useCreateTodo(listId: string) {
  const { qc, key, settle } = useListKeys(listId);
  return useMutation(
    orpc.todos.create.mutationOptions({
      onMutate: async (input) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<Todo[]>(key);
        const temp: Todo = {
          id: `temp-${Date.now()}`,
          listId,
          title: input.title,
          notes: "",
          status: "todo",
          progress: 0,
          dueDate: input.dueDate ?? null,
          createdAt: new Date(),
          updatedAt: new Date(),
          updatedByName: "You",
        };
        qc.setQueryData<Todo[]>(key, (old) => [...(old ?? []), temp]);
        return { prev };
      },
      onError: (_e, _i, ctx) => qc.setQueryData(key, ctx?.prev),
      onSettled: settle,
    }),
  );
}

export function useUpdateTodo(listId: string) {
  const { qc, key, settle } = useListKeys(listId);
  return useMutation(
    orpc.todos.update.mutationOptions({
      onMutate: async (input) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<Todo[]>(key);
        qc.setQueryData<Todo[]>(key, (old) =>
          old?.map((t) => {
            if (t.id !== input.id) return t;
            const next = { ...t, ...Object.fromEntries(Object.entries(input).filter(([, v]) => v !== undefined)) } as Todo;
            if (input.status === "done") next.progress = 100;
            if (input.status === "todo" && input.progress === undefined) next.progress = 0;
            if (input.progress !== undefined && input.status === undefined)
              next.status = input.progress === 100 ? "done" : input.progress === 0 ? "todo" : "in_progress";
            return next;
          }),
        );
        return { prev };
      },
      onError: (_e, _i, ctx) => qc.setQueryData(key, ctx?.prev),
      onSettled: settle,
    }),
  );
}

export function useDeleteTodo(listId: string) {
  const { qc, key, settle } = useListKeys(listId);
  return useMutation(
    orpc.todos.delete.mutationOptions({
      onMutate: async ({ id }) => {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<Todo[]>(key);
        qc.setQueryData<Todo[]>(key, (old) => old?.filter((t) => t.id !== id));
        return { prev };
      },
      onError: (_e, _i, ctx) => qc.setQueryData(key, ctx?.prev),
      onSettled: settle,
    }),
  );
}
