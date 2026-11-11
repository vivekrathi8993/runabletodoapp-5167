import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Calendar, Check, ChevronDown, Trash2 } from "lucide-react";
import { useDeleteTodo, useUpdateTodo, type Status, type Todo } from "../queries/todos";
import { formatDue, timeAgo } from "../lib/format";
import { ActivityFeed } from "./activity-feed";

const STATUSES: { v: Status; label: string }[] = [
  { v: "todo", label: "To do" },
  { v: "in_progress", label: "In progress" },
  { v: "done", label: "Done" },
];

export function StatusControl({ value, onChange, disabled }: { value: Status; onChange: (s: Status) => void; disabled?: boolean }) {
  return (
    <div className="inline-grid grid-cols-3 rounded-md border border-line bg-paper/60 p-0.5 text-[12px] font-medium">
      {STATUSES.map((s) => {
        const active = s.v === value;
        const tone =
          s.v === "done" ? "bg-moss text-white" : s.v === "in_progress" ? "bg-tangerine text-white" : "bg-ink text-card";
        return (
          <button
            key={s.v}
            type="button"
            disabled={disabled}
            onClick={() => onChange(s.v)}
            className={`whitespace-nowrap rounded-[5px] px-2.5 py-1 transition ${active ? tone : "text-ink-soft hover:text-ink"}`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

export function TodoItem({ todo, index }: { todo: Todo; index: number }) {
  const update = useUpdateTodo(todo.listId);
  const remove = useDeleteTodo(todo.listId);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(todo.progress);
  const [dragging, setDragging] = useState(false);
  const [title, setTitle] = useState(todo.title);
  const [notes, setNotes] = useState(todo.notes);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = todo.id.startsWith("temp-");

  // Sync with server/collaborator changes unless the user is mid-edit.
  useEffect(() => {
    if (!dragging && !timer.current) setProgress(todo.progress);
  }, [todo.progress, dragging]);
  useEffect(() => setTitle(todo.title), [todo.title]);
  useEffect(() => setNotes(todo.notes), [todo.notes]);

  const commitProgress = (value: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      timer.current = null;
      if (value !== todo.progress) update.mutate({ id: todo.id, progress: value });
    }, 350);
  };

  const done = todo.status === "done";
  const due = formatDue(todo.dueDate);
  const fill = progress === 100 ? "var(--moss)" : "var(--tangerine)";

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ delay: Math.min(index, 10) * 0.03, duration: 0.35 }}
      className={`group rounded-lg border bg-card transition ${open ? "border-ink/40 shadow-[0_12px_30px_-18px_rgba(26,25,22,0.4)]" : "border-line hover:border-ink/25"} ${pending ? "opacity-60" : ""}`}
    >
      <div className="flex items-start gap-3.5 px-4 pb-3 pt-4 sm:px-5">
        <button
          aria-label={done ? "Mark as to do" : "Mark as done"}
          disabled={pending}
          onClick={() => update.mutate({ id: todo.id, status: done ? "todo" : "done" })}
          className={`mt-0.5 grid h-[22px] w-[22px] shrink-0 place-items-center rounded-full border-2 transition ${done ? "border-moss bg-moss text-white" : "border-ink-soft/50 hover:border-moss"}`}
        >
          {done && <Check className="h-3 w-3" strokeWidth={4} />}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
            <button onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
              <span className={`block text-[16px] font-medium leading-snug ${done ? "text-ink-soft line-through decoration-ink-soft/50" : ""}`}>
                {todo.title}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
                {due && (
                  <span className={`inline-flex items-center gap-1 ${due.overdue && !done ? "font-medium text-danger" : ""}`}>
                    <Calendar className="h-3 w-3" /> {due.label}
                  </span>
                )}
                {todo.notes && <span className="max-w-[260px] truncate">{todo.notes}</span>}
                {todo.updatedByName && <span>edited by {todo.updatedByName} · {timeAgo(todo.updatedAt)}</span>}
              </span>
            </button>
            <StatusControl value={todo.status} disabled={pending} onChange={(s) => s !== todo.status && update.mutate({ id: todo.id, status: s })} />
          </div>

          <div className="mt-2 flex items-center gap-3">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={progress}
              disabled={pending}
              aria-label="Progress"
              onPointerDown={() => setDragging(true)}
              onPointerUp={() => setDragging(false)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setProgress(v);
                commitProgress(v);
              }}
              className="progress-range"
              style={{ "--pct": `${progress}%`, "--fill": fill } as React.CSSProperties}
            />
            <span className="tabular w-12 text-right font-display text-lg leading-none">{progress}%</span>
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Details"
              className="rounded p-1 text-ink-soft transition hover:bg-paper-2 hover:text-ink"
            >
              <ChevronDown className={`h-4 w-4 transition ${open ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && !pending && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="grid gap-5 border-t border-dashed border-line px-4 py-4 sm:grid-cols-[1fr_260px] sm:px-5 sm:pl-[58px]">
              <div className="space-y-3">
                <label className="block">
                  <span className="label mb-1 block">Title</span>
                  <input aria-label="Title"
                    className="field"
                    value={title}
                    maxLength={200}
                    onChange={(e) => setTitle(e.target.value)}
                    onBlur={() => title.trim() && title !== todo.title && update.mutate({ id: todo.id, title })}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                </label>
                <label className="block">
                  <span className="label mb-1 block">Notes</span>
                  <textarea aria-label="Notes"
                    className="field min-h-[88px] resize-y"
                    placeholder="Add context, links, next steps…"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    onBlur={() => notes !== todo.notes && update.mutate({ id: todo.id, notes })}
                  />
                </label>
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <label className="block">
                    <span className="label mb-1 block">Due date</span>
                    <input aria-label="Due date"
                      type="date"
                      className="field w-auto py-2"
                      value={todo.dueDate ?? ""}
                      onChange={(e) => update.mutate({ id: todo.id, dueDate: e.target.value || null })}
                    />
                  </label>
                  <button
                    onClick={() => remove.mutate({ id: todo.id })}
                    className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-danger transition hover:bg-tangerine-soft"
                  >
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
              <div>
                <span className="label mb-2 block">History</span>
                <div className="max-h-[240px] overflow-y-auto pr-1">
                  <ActivityFeed listId={todo.listId} todoId={todo.id} compact />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
}
