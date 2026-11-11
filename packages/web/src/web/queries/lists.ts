import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { orpc } from "../lib/api";

const POLL = 4000;

export function useMyLists() {
  return useQuery(orpc.lists.mine.queryOptions({ refetchInterval: POLL * 2 }));
}
export function useList(id: string) {
  return useQuery(orpc.lists.get.queryOptions({ input: { id }, refetchInterval: POLL, retry: false }));
}

function useInvalidateLists() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: orpc.lists.key() });
    qc.invalidateQueries({ queryKey: orpc.todos.activity.key() });
  };
}

export function useCreateList() {
  const invalidate = useInvalidateLists();
  return useMutation(orpc.lists.create.mutationOptions({ onSuccess: invalidate }));
}
export function useRenameList() {
  const invalidate = useInvalidateLists();
  return useMutation(orpc.lists.rename.mutationOptions({ onSuccess: invalidate }));
}
export function useDeleteList() {
  const invalidate = useInvalidateLists();
  return useMutation(orpc.lists.delete.mutationOptions({ onSuccess: invalidate }));
}
export function useInvite() {
  const invalidate = useInvalidateLists();
  return useMutation(orpc.lists.invite.mutationOptions({ onSuccess: invalidate }));
}
export function useRemoveMember() {
  const invalidate = useInvalidateLists();
  return useMutation(orpc.lists.removeMember.mutationOptions({ onSuccess: invalidate }));
}
