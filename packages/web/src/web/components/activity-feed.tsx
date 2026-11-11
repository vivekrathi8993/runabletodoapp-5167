import { Loader2 } from "lucide-react";
import { useActivity } from "../queries/todos";
import { Avatar } from "./avatar";
import { timeAgo } from "../lib/format";

function describe(a: { action: string; detail: string; todoTitle: string }, withTodo: boolean) {
  const t = withTodo && a.todoTitle ? <b className="font-medium text-ink">“{a.todoTitle}”</b> : null;
  switch (a.action) {
    case "list_created":
      return <>created this list</>;
    case "list_renamed":
      return <>renamed the list ({a.detail})</>;
    case "member_added":
      return <>invited <b className="font-medium text-ink">{a.detail}</b></>;
    case "member_removed":
      return <>removed <b className="font-medium text-ink">{a.detail}</b></>;
    case "member_left":
      return <>left the list</>;
    case "todo_created":
      return <>added {t ?? "this todo"}</>;
    case "todo_deleted":
      return <>deleted {t}</>;
    case "status":
      return <>{t ? <>set {t} </> : "set status "}<span className="text-ink">{a.detail}</span></>;
    case "progress":
      return <>{t ? <>moved {t} </> : "moved progress "}<span className="tabular text-ink">{a.detail}</span></>;
    case "renamed":
      return <>renamed to {t ?? <span className="text-ink">{a.detail.split(" → ")[1]}</span>}</>;
    case "notes":
      return <>{a.detail} {t ? <>on {t}</> : null}</>;
    case "due":
      return <>{t ? <>{t} </> : null}{a.detail}</>;
    default:
      return <>{a.action} {a.detail}</>;
  }
}

export function ActivityFeed({ listId, todoId, compact }: { listId: string; todoId?: string; compact?: boolean }) {
  const activity = useActivity(listId, todoId);
  if (activity.isLoading)
    return (
      <div className="flex items-center gap-2 py-3 text-sm text-ink-soft">
        <Loader2 className="h-4 w-4 animate-spin" /> Loading history…
      </div>
    );
  if (!activity.data?.length) return <p className="py-2 text-sm text-ink-soft">No activity yet.</p>;
  return (
    <ol className={`relative ${compact ? "space-y-2.5" : "space-y-3.5"}`}>
      {activity.data.map((a) => (
        <li key={a.id} className="flex gap-2.5 text-[13px] leading-snug text-ink-soft">
          <Avatar name={a.userName ?? "Deleted user"} size={compact ? 20 : 24} />
          <div className="min-w-0">
            <b className="font-medium text-ink">{a.userName?.split(" ")[0] ?? "Someone"}</b> {describe(a, !todoId)}
            <div className="mt-0.5 text-[11px] text-ink-soft/80">{timeAgo(a.createdAt)}</div>
          </div>
        </li>
      ))}
    </ol>
  );
}
