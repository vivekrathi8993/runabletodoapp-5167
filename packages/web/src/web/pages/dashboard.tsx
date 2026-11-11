import { useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "motion/react";
import { ArrowUpRight, Loader2, Plus, Users } from "lucide-react";
import { AppShell } from "../components/app-shell";
import { ProgressBar } from "../components/progress-bar";
import { useCreateList, useMyLists } from "../queries/lists";
import { authClient } from "../lib/auth";
import { errorMessage, timeAgo } from "../lib/format";
import type { AppRouterClient } from "../../api";

type ListRow = Awaited<ReturnType<AppRouterClient["lists"]["mine"]>>["owned"][number];

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

function ListRowItem({ list, index, shared }: { list: ListRow; index: number; shared?: boolean }) {
  const { total, done, avg } = list.stats;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * index, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link
        to={`/app/lists/${list.id}`}
        className="group grid grid-cols-[1fr_auto] items-center gap-x-6 gap-y-3 border-b border-line px-1 py-5 transition hover:bg-card/70 sm:grid-cols-[minmax(0,1fr)_220px_90px_24px] sm:px-4"
      >
        <div className="min-w-0">
          <div className="truncate font-display text-[22px] font-medium leading-tight group-hover:text-tangerine">{list.name}</div>
          <div className="mt-1 flex items-center gap-3 text-xs text-ink-soft">
            {shared ? <span>by {list.ownerName}</span> : null}
            {list.memberCount > 1 && (
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {list.memberCount}
              </span>
            )}
            <span>updated {timeAgo(list.updatedAt)}</span>
          </div>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <ProgressBar value={avg} tone={total > 0 && done === total ? "moss" : "tangerine"} />
          <div className="mt-1.5 text-xs text-ink-soft">
            {total === 0 ? "No todos yet" : `${done} of ${total} done`}
          </div>
        </div>
        <div className="tabular hidden text-right font-display text-2xl sm:block">{avg}%</div>
        <ArrowUpRight className="hidden h-5 w-5 text-ink-soft transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-tangerine sm:block" />
      </Link>
    </motion.div>
  );
}

function NewList() {
  const [name, setName] = useState("");
  const create = useCreateList();
  const [, navigate] = useLocation();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        create.mutate({ name }, { onSuccess: (l) => navigate(`/app/lists/${l.id}`) });
      }}
      className="flex flex-col gap-2 sm:flex-row"
    >
      <input aria-label="New list name" className="field sm:w-72" placeholder="Name a new list…" value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      <button
        disabled={create.isPending || !name.trim()}
        className="inline-flex items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 text-sm font-medium text-card transition hover:bg-tangerine disabled:opacity-50"
      >
        {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        New list
      </button>
      {create.error && <p className="text-sm text-danger">{errorMessage(create.error)}</p>}
    </form>
  );
}

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const lists = useMyLists();
  const all = [...(lists.data?.owned ?? []), ...(lists.data?.shared ?? [])];
  const totals = all.reduce(
    (a, l) => ({ total: a.total + l.stats.total, done: a.done + l.stats.done }),
    { total: 0, done: 0 },
  );
  const firstName = session?.user.name.split(" ")[0];

  return (
    <AppShell>
      <section className="mb-12 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="label mb-3">{new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}</div>
          <h1 className="font-display text-[44px] font-semibold leading-[1.02] tracking-tight sm:text-[60px]">
            {greeting()}, <span className="italic text-tangerine">{firstName}</span>.
          </h1>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
          className="flex gap-8 border-l-2 border-ink pl-6"
        >
          {[
            { k: "Lists", v: all.length },
            { k: "Open", v: totals.total - totals.done },
            { k: "Done", v: totals.done },
          ].map((s) => (
            <div key={s.k}>
              <div className="tabular font-display text-4xl font-semibold">{lists.isLoading ? "–" : s.v}</div>
              <div className="label mt-1">{s.k}</div>
            </div>
          ))}
        </motion.div>
      </section>

      <section className="mb-14">
        <div className="mb-3 flex flex-col justify-between gap-4 border-b-2 border-ink pb-4 sm:flex-row sm:items-end">
          <h2 className="font-display text-2xl font-semibold">My lists</h2>
          <NewList />
        </div>
        {lists.isLoading ? (
          <div className="space-y-3 pt-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-md bg-paper-2/70" />
            ))}
          </div>
        ) : lists.error ? (
          <p className="py-8 text-danger">{errorMessage(lists.error)}</p>
        ) : lists.data?.owned.length ? (
          lists.data.owned.map((l, i) => <ListRowItem key={l.id} list={l} index={i} />)
        ) : (
          <div className="py-14 text-center">
            <div className="font-display text-2xl italic text-ink-soft">A blank page.</div>
            <p className="mt-2 text-sm text-ink-soft">Name your first list above — groceries, a project, a trip.</p>
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 border-b-2 border-ink pb-4">
          <h2 className="font-display text-2xl font-semibold">Shared with me</h2>
        </div>
        {lists.isLoading ? (
          <div className="h-20 animate-pulse rounded-md bg-paper-2/70" />
        ) : lists.data?.shared.length ? (
          lists.data.shared.map((l, i) => <ListRowItem key={l.id} list={l} index={i} shared />)
        ) : (
          <p className="py-8 text-sm text-ink-soft">
            Nothing yet. When someone invites <b className="font-medium text-ink">{session?.user.email}</b> to a list, it shows up here.
          </p>
        )}
      </section>
    </AppShell>
  );
}
