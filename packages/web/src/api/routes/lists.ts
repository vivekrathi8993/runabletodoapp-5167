import { z } from "zod";
import { ORPCError } from "@orpc/server";
import { and, eq, inArray, sql, desc } from "drizzle-orm";
import { authed } from "../middleware/auth";
import { db } from "../database";
import { lists as listsT, listMembers, todos as todosT, user } from "../database/schema";
import { logActivity, requireAccess, requireOwner } from "../lib/access";

async function summarize(listIds: string[]) {
  if (listIds.length === 0) return new Map<string, { total: number; done: number; avg: number }>();
  const rows = await db
    .select({
      listId: todosT.listId,
      total: sql<number>`count(*)`,
      done: sql<number>`sum(case when ${todosT.status} = 'done' then 1 else 0 end)`,
      avg: sql<number>`avg(${todosT.progress})`,
    })
    .from(todosT)
    .where(inArray(todosT.listId, listIds))
    .groupBy(todosT.listId);
  return new Map(
    rows.map((r) => [
      r.listId,
      { total: Number(r.total), done: Number(r.done ?? 0), avg: Math.round(Number(r.avg ?? 0)) },
    ]),
  );
}

async function memberCounts(listIds: string[]) {
  if (listIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ listId: listMembers.listId, n: sql<number>`count(*)` })
    .from(listMembers)
    .where(inArray(listMembers.listId, listIds))
    .groupBy(listMembers.listId);
  return new Map(rows.map((r) => [r.listId, Number(r.n)]));
}

export const lists = {
  mine: authed.handler(async ({ context }) => {
    const uid = context.user.id;
    const owned = await db
      .select({ id: listsT.id, name: listsT.name, updatedAt: listsT.updatedAt, ownerId: listsT.ownerId, ownerName: user.name })
      .from(listsT)
      .innerJoin(user, eq(user.id, listsT.ownerId))
      .where(eq(listsT.ownerId, uid))
      .orderBy(desc(listsT.updatedAt));
    const shared = await db
      .select({ id: listsT.id, name: listsT.name, updatedAt: listsT.updatedAt, ownerId: listsT.ownerId, ownerName: user.name })
      .from(listMembers)
      .innerJoin(listsT, eq(listsT.id, listMembers.listId))
      .innerJoin(user, eq(user.id, listsT.ownerId))
      .where(eq(listMembers.userId, uid))
      .orderBy(desc(listsT.updatedAt));
    const ids = [...owned, ...shared].map((l) => l.id);
    const [stats, members] = await Promise.all([summarize(ids), memberCounts(ids)]);
    const decorate = (l: (typeof owned)[number]) => ({
      ...l,
      stats: stats.get(l.id) ?? { total: 0, done: 0, avg: 0 },
      memberCount: (members.get(l.id) ?? 0) + 1,
    });
    return { owned: owned.map(decorate), shared: shared.map(decorate) };
  }),

  get: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    const { list, role } = await requireAccess(input.id, context.user.id);
    const [owner] = await db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.id, list.ownerId));
    const members = await db
      .select({ id: user.id, name: user.name, email: user.email, addedAt: listMembers.addedAt })
      .from(listMembers)
      .innerJoin(user, eq(user.id, listMembers.userId))
      .where(eq(listMembers.listId, list.id))
      .orderBy(listMembers.addedAt);
    return { ...list, role, owner, members };
  }),

  create: authed
    .input(z.object({ name: z.string().trim().min(1).max(80) }))
    .handler(async ({ input, context }) => {
      const [list] = await db
        .insert(listsT)
        .values({ id: crypto.randomUUID(), name: input.name, ownerId: context.user.id })
        .returning();
      await logActivity({ listId: list.id, userId: context.user.id, action: "list_created", detail: input.name });
      return list;
    }),

  rename: authed
    .input(z.object({ id: z.string(), name: z.string().trim().min(1).max(80) }))
    .handler(async ({ input, context }) => {
      const { list } = await requireOwner(input.id, context.user.id);
      await db.update(listsT).set({ name: input.name }).where(eq(listsT.id, input.id));
      await logActivity({ listId: input.id, userId: context.user.id, action: "list_renamed", detail: `${list.name} → ${input.name}` });
      return { ok: true };
    }),

  delete: authed.input(z.object({ id: z.string() })).handler(async ({ input, context }) => {
    await requireOwner(input.id, context.user.id);
    await db.delete(listsT).where(eq(listsT.id, input.id));
    return { ok: true };
  }),

  invite: authed
    .input(z.object({ listId: z.string(), email: z.string().trim().toLowerCase().email() }))
    .handler(async ({ input, context }) => {
      const { list } = await requireAccess(input.listId, context.user.id);
      const [target] = await db.select().from(user).where(eq(user.email, input.email));
      if (!target)
        throw new ORPCError("NOT_FOUND", {
          message: "No Tally account uses that email yet. Ask them to sign up first.",
        });
      if (target.id === list.ownerId)
        throw new ORPCError("CONFLICT", { message: "That person owns this list." });
      const [existing] = await db
        .select()
        .from(listMembers)
        .where(and(eq(listMembers.listId, list.id), eq(listMembers.userId, target.id)));
      if (existing) throw new ORPCError("CONFLICT", { message: `${target.name} is already on this list.` });
      await db.insert(listMembers).values({ listId: list.id, userId: target.id });
      await logActivity({ listId: list.id, userId: context.user.id, action: "member_added", detail: target.name });
      return { id: target.id, name: target.name, email: target.email };
    }),

  removeMember: authed
    .input(z.object({ listId: z.string(), userId: z.string() }))
    .handler(async ({ input, context }) => {
      const isSelf = input.userId === context.user.id;
      if (isSelf) await requireAccess(input.listId, context.user.id);
      else await requireOwner(input.listId, context.user.id);
      const [target] = await db.select({ name: user.name }).from(user).where(eq(user.id, input.userId));
      await db
        .delete(listMembers)
        .where(and(eq(listMembers.listId, input.listId), eq(listMembers.userId, input.userId)));
      await logActivity({
        listId: input.listId,
        userId: context.user.id,
        action: isSelf ? "member_left" : "member_removed",
        detail: target?.name ?? "",
      });
      return { ok: true };
    }),
};
