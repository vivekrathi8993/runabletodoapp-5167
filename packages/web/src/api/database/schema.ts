import { sqliteTable, text, integer, index, primaryKey } from "drizzle-orm/sqlite-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

const now = () => new Date();

export const lists = sqliteTable("lists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
});

export const listMembers = sqliteTable(
  "list_members",
  {
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    addedAt: integer("added_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [primaryKey({ columns: [t.listId, t.userId] }), index("list_members_user_idx").on(t.userId)],
);

export const todos = sqliteTable(
  "todos",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    status: text("status", { enum: ["todo", "in_progress", "done"] })
      .notNull()
      .default("todo"),
    progress: integer("progress").notNull().default(0),
    dueDate: text("due_date"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    updatedBy: text("updated_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("todos_list_idx").on(t.listId)],
);

export const todoActivity = sqliteTable(
  "todo_activity",
  {
    id: text("id").primaryKey(),
    listId: text("list_id")
      .notNull()
      .references(() => lists.id, { onDelete: "cascade" }),
    todoId: text("todo_id"),
    todoTitle: text("todo_title").notNull().default(""),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    detail: text("detail").notNull().default(""),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull().$defaultFn(now),
  },
  (t) => [index("activity_list_idx").on(t.listId), index("activity_todo_idx").on(t.todoId)],
);
