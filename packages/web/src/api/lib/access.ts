import { ORPCError } from "@orpc/server";
import { and, eq } from "drizzle-orm";
import { db } from "../database";
import { lists, listMembers, todoActivity } from "../database/schema";

export type Role = "owner" | "editor";

/** Resolves the caller's role on a list, throwing NOT_FOUND when they have no access. */
export async function requireAccess(listId: string, userId: string) {
  const [list] = await db.select().from(lists).where(eq(lists.id, listId));
  if (!list) throw new ORPCError("NOT_FOUND", { message: "List not found" });
  if (list.ownerId === userId) return { list, role: "owner" as Role };
  const [member] = await db
    .select()
    .from(listMembers)
    .where(and(eq(listMembers.listId, listId), eq(listMembers.userId, userId)));
  if (!member) throw new ORPCError("NOT_FOUND", { message: "List not found" });
  return { list, role: "editor" as Role };
}

export async function requireOwner(listId: string, userId: string) {
  const access = await requireAccess(listId, userId);
  if (access.role !== "owner")
    throw new ORPCError("FORBIDDEN", { message: "Only the list owner can do that" });
  return access;
}

export async function logActivity(entry: {
  listId: string;
  userId: string;
  action: string;
  detail?: string;
  todoId?: string | null;
  todoTitle?: string;
}) {
  await db.insert(todoActivity).values({
    id: crypto.randomUUID(),
    listId: entry.listId,
    userId: entry.userId,
    action: entry.action,
    detail: entry.detail ?? "",
    todoId: entry.todoId ?? null,
    todoTitle: entry.todoTitle ?? "",
  });
  await db.update(lists).set({ updatedAt: new Date() }).where(eq(lists.id, entry.listId));
}
