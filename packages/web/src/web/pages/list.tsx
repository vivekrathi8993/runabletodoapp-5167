import { useState } from "react";
import { Link, useLocation, useParams } from "wouter";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, Calendar, Check, Loader2, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { ProgressBar } from "../components/progress-bar";
import { TodoItem } from "../components/todo-item";
import { SharePanel } from "../components/share-panel";
import { ActivityFeed } from "../components/activity-feed";
import { AvatarStack } from "../components/avatar";
import { useDeleteList, useList, useRenameList } from "../queries/lists";
import { useCreateTodo, useTodos, type Status } from "../queries/todos";
import { authClient } from "../lib/auth";
import { errorMessage } from "../lib/format";

type Filter = "all" | Status;

function AddTodo({ listId }: { listId: string }) {
  const [title, setTitle] = useState("");
  const [due, setDue] = useState("");
  const create = useCreateTodo(listId);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        create.mutate({ listId, title: title.trim(), dueDate: due || null });
        setTitle("");
        setDue("");
      }}
      className="flex flex-col gap-2 rounded-lg border-2 border-ink bg-card p-2 sm:flex-row sm:items-center"
    >
      <div className="flex flex-1 items-center gap-2 pl-2">
        <Plus className="h-5 w-5 shrink-0 text-tangerine" />
        <input aria-label="New todo"
          className="w-full bg-transparent py-2 text-[16px] outline-none placeholder:text-ink-soft/60"
          placeholder="Add a todo and press Enter"
          value={title}
          maxLength={200}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-1.5 rounded-md border border-line px-2.5 py-1.5 text-sm text-ink-soft">
          <Calendar className="h-4 w-4" />
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)} className="bg-transparent text-sm outline-none" aria-label="Due date" />
        </label>
        <button
          disabled={!title.trim()}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-card transition hover:bg-tangerine disabled:opacity-40"
        >
          Add
        </button>
      </div>
    </form>
  );
}

function ListHeader({ list, stats }: { list: NonNullable<ReturnType<typeof useList>["data"]>; stats: { total: number; done: number; avg: number } }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(list.name);
  const [menu, setMenu] = useState(false);
  const rename = useRenameList();
  const del = useDeleteList();
  const [, navigate] = useLocation();
  const isOwner = list.role === "owner";

  return (
    <motion.section initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-10">
      <Link to="/app" className="mb-6 inline-flex items-center gap-1.5 text-sm text-ink-soft transition hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All lists
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div className="min-w-0 flex-1">
          <div className="label mb-2 flex items-center gap-2">
            {isOwner ? "Your list" : `Shared by ${list.owner?.name}`}
            <AvatarStack names={[list.owner?.name ?? "", ...list.members.map((m) => m.name)]} size={20} />
          </div>
          {editing ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!name.trim()) return;
                rename.mutate({ id: list.id, name }, { onSuccess: () => setEditing(false) });
              }}
              className="flex items-center gap-2"
            >
              <input aria-label="List name"
                className="w-full max-w-xl border-b-2 border-tangerine bg-transparent font-display text-[40px] font-semibold leading-tight outline-none sm:text-[52px]"
                value={name}
                maxLength={80}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Escape" && setEditing(false)}
              />
              <button className="rounded-md bg-ink p-2 text-card" aria-label="Save">
                {rename.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
              </button>
            </form>
          ) : (
            <h1 className="font-display text-[40px] font-semibold leading-[1.05] tracking-tight sm:text-[56px]">{list.name}</h1>
          )}
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="tabular font-display text-[52px] font-semibold leading-none">
              {stats.avg}
              <span className="text-2xl text-ink-soft">%</span>
            </div>
            <div className="label mt-1">{stats.done} / {stats.total} done</div>
          </div>
          {isOwner && (
            <div className="relative">
              <button onClick={() => setMenu((m) => !m)} className="rounded-md border border-line p-2 transition hover:bg-card" aria-label="List options">
                <MoreHorizontal className="h-5 w-5" />
              </button>
              {menu && (
                <>
                  <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setMenu(false)} />
                  <div className="absolute right-0 z-20 mt-2 w-44 rounded-lg border border-line bg-card p-1.5 shadow-lg">
                    <button
                      onClick={() => {
                        setName(list.name);
                        setEditing(true);
                        setMenu(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-paper-2"
                    >
                      <Pencil className="h-4 w-4" /> Rename
                    </button>
                    <button
                      onClick={() => {
                        if (!confirm(`Delete "${list.name}" and all its todos for everyone?`)) return;
                        del.mutate({ id: list.id }, { onSuccess: () => navigate("/app") });
                      }}
                      className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-danger hover:bg-tangerine-soft"
                    >
                      <Trash2 className="h-4 w-4" /> Delete list
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
      <div className="mt-6">
        <ProgressBar value={stats.avg} height={8} tone={stats.total > 0 && stats.done === stats.total ? "moss" : "tangerine"} />
      </div>
    </motion.section>
  );
}

export default function ListPage() {
  const { id } = useParams<{ id: string }>();
  const { data: session } = authClient.useSession();
  const list = useList(id);
  const todos = useTodos(id);
  const [filter, setFilter] = useState<Filter>("all");

  if (list.isLoading)
    return (
      <AppShell>
        <div className="grid place-items-center py-32 text-ink-soft">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </AppShell>
    );
  if (list.error || !list.data)
    return (
      <AppShell>
        <div className="py-24 text-center">
          <div className="font-display text-3xl italic">This list isn't available.</div>
          <p className="mt-2 text-ink-soft">{errorMessage(list.error, "It may have been deleted, or you no longer have access.")}</p>
          <Link to="/app" className="mt-6 inline-block rounded-md bg-ink px-4 py-2 text-sm text-card">Back to my lists</Link>
        </div>
      </AppShell>
    );

  const items = todos.data ?? [];
  const stats = {
    total: items.length,
    done: items.filter((t) => t.status === "done").length,
    avg: items.length ? Math.round(items.reduce((a, t) => a + t.progress, 0) / items.length) : 0,
  };
  const counts = {
    all: items.length,
    todo: items.filter((t) => t.status === "todo").length,
    in_progress: items.filter((t) => t.status === "in_progress").length,
    done: stats.done,
  };
  const visible = filter === "all" ? items : items.filter((t) => t.status === filter);
  const filters: { v: Filter; label: string }[] = [
    { v: "all", label: "All" },
    { v: "todo", label: "To do" },
    { v: "in_progress", label: "In progress" },
    { v: "done", label: "Done" },
  ];

  return (
    <AppShell>
      <ListHeader list={list.data} stats={stats} />
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <AddTodo listId={id} />
          <div className="mb-4 mt-8 flex flex-wrap gap-1.5">
            {filters.map((f) => (
              <button
                key={f.v}
                onClick={() => setFilter(f.v)}
                className={`rounded-full border px-3.5 py-1.5 text-sm transition ${filter === f.v ? "border-ink bg-ink text-card" : "border-line text-ink-soft hover:border-ink/40 hover:text-ink"}`}
              >
                {f.label} <span className="tabular ml-1 opacity-60">{counts[f.v]}</span>
              </button>
            ))}
          </div>
          {todos.isLoading ? (
            <div className="space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-lg bg-paper-2/70" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border border-dashed border-line py-16 text-center">
              <div className="font-display text-2xl italic text-ink-soft">
                {items.length === 0 ? "Nothing to tally yet." : "Nothing here."}
              </div>
              <p className="mt-1 text-sm text-ink-soft">
                {items.length === 0 ? "Add your first todo above." : "Try another filter."}
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              <AnimatePresence initial={false}>
                {visible.map((t, i) => (
                  <TodoItem key={t.id} todo={t} index={i} />
                ))}
              </AnimatePresence>
            </ul>
          )}
        </div>

        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {list.data.owner && session && (
            <SharePanel
              listId={id}
              owner={list.data.owner}
              members={list.data.members}
              role={list.data.role}
              meId={session.user.id}
            />
          )}
          <div className="rounded-lg border border-line bg-card p-5">
            <div className="mb-4 flex items-baseline justify-between">
              <h3 className="font-display text-lg font-semibold">Activity</h3>
              <span className="label inline-flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-moss" /> Live
              </span>
            </div>
            <div className="max-h-[420px] overflow-y-auto pr-1">
              <ActivityFeed listId={id} />
            </div>
          </div>
        </aside>
      </div>
    </AppShell>
  );
}
