import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, asc, desc, eq } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { todos as todosT, todoActivity, user } from "../database/schema";
import { logActivity, requireAccess } from "../lib/access";

const statusEnum = z.enum(["todo", "in_progress", "done"]);
const statusLabel = { todo: "To do", in_progress: "In progress", done: "Done" } as const;

async function loadTodo(id: string, userId: string) {
  const [todo] = await db.select().from(todosT).where(eq(todosT.id, id));
  if (!todo) throw new ORPCError("NOT_FOUND", { message: "Todo not found" });
  await requireAccess(todo.listId, userId);
  return todo;
}

const updater = alias(user, "updater");

export const todos = {
  list: authed.input(z.object({ listId: z.string() })).handler(async ({ input, context }) => {
    await requireAccess(input.listId, context.user.id);
    return db
      .select({
        id: todosT.id,
        listId: todosT.listId,
        title: todosT.title,
        notes: todosT.notes,
        status: todosT.status,
        progress: todosT.progress,
        dueDate: todosT.dueDate,
        createdAt: todosT.createdAt,
        updatedAt: todosT.updatedAt,
        updatedByName: updater.name,
      })
      .from(todosT)
      .leftJoin(updater, eq(updater.id, todosT.updatedBy))
      .where(eq(todosT.listId, input.listId))
      .orderBy(asc(todosT.createdAt));
  }),

  create: authed
    .input(
      z.object({
        listId: z.string(),
        title: z.string().trim().min(1).max(200),
        dueDate: z.string().nullable().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      await requireAccess(input.listId, context.user.id);
      const [todo] = await db
        .insert(todosT)
        .values({
          id: crypto.randomUUID(),
          listId: input.listId,
          title: input.title,
          dueDate: input.dueDate ?? null,
          createdBy: context.user.id,
          updatedBy: context.user.id,
        })
        .returning();
      await logActivity({ listId: input.listId, userId: context.user.id, action: "todo_created", todoId: todo.id, todoTitle: todo.title });
      return todo;
    }),

  update: authed
    .input(
      z.object({
        id: z.string(),
        title: z.string().trim().min(1).max(200).optional(),
        notes: z.string().max(5000).optional(),
        status: statusEnum.optional(),
        progress: z.number().int().min(0).max(100).optional(),
        dueDate: z.string().nullable().optional(),
      }),
    )
    .handler(async ({ input, context }) => {
      const prev = await loadTodo(input.id, context.user.id);
      let status = input.status ?? prev.status;
      let progress = input.progress ?? prev.progress;
      // Keep status and progress consistent with each other.
      if (input.status === "done") progress = 100;
      else if (input.status === "todo" && input.progress === undefined) progress = 0;
      else if (input.status === "in_progress" && input.progress === undefined && (prev.progress === 0 || prev.progress === 100)) progress = prev.progress === 100 ? 90 : 10;
      if (input.progress !== undefined && input.status === undefined) {
        if (progress === 100) status = "done";
        else if (progress === 0) status = "todo";
        else status = "in_progress";
      }
      const next = {
        title: input.title ?? prev.title,
        notes: input.notes ?? prev.notes,
        dueDate: input.dueDate === undefined ? prev.dueDate : input.dueDate,
        status,
        progress,
      };
      const [todo] = await db
        .update(todosT)
        .set({ ...next, updatedBy: context.user.id, updatedAt: new Date() })
        .where(eq(todosT.id, prev.id))
        .returning();

      const log = (action: string, detail: string) =>
        logActivity({ listId: prev.listId, userId: context.user.id, action, detail, todoId: prev.id, todoTitle: next.title });
      if (next.status !== prev.status) await log("status", `${statusLabel[prev.status]} → ${statusLabel[next.status]}`);
      if (next.progress !== prev.progress) await log("progress", `${prev.progress}% → ${next.progress}%`);
      if (next.title !== prev.title) await log("renamed", `${prev.title} → ${next.title}`);
      if (next.notes !== prev.notes) await log("notes", next.notes ? "updated notes" : "cleared notes");
      if (next.dueDate !== prev.dueDate) await log("due", next.dueDate ? `due ${next.dueDate}` : "removed due date");
      return todo;
    }),

  delete: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const prev = await loadTodo(input.id, context.user.id);
    await db.delete(todosT).where(eq(todosT.id, prev.id));
    await logActivity({ listId: prev.listId, userId: context.user.id, action: "todo_deleted", todoId: prev.id, todoTitle: prev.title });
    return { ok: true };
  }),

  activity: authed
    .input(z.object({ listId: z.string(), todoId: z.string().optional(), limit: z.number().int().min(1).max(200).default(50) }))
    .handler(async ({ input, context }) => {
      await requireAccess(input.listId, context.user.id);
      const where = input.todoId
        ? and(eq(todoActivity.listId, input.listId), eq(todoActivity.todoId, input.todoId))
        : eq(todoActivity.listId, input.listId);
      return db
        .select({
          id: todoActivity.id,
          action: todoActivity.action,
          detail: todoActivity.detail,
          todoId: todoActivity.todoId,
          todoTitle: todoActivity.todoTitle,
          createdAt: todoActivity.createdAt,
          userId: todoActivity.userId,
          userName: user.name,
        })
        .from(todoActivity)
        .leftJoin(user, eq(user.id, todoActivity.userId))
        .where(where)
        .orderBy(desc(todoActivity.createdAt))
        .limit(input.limit);
    }),
};
