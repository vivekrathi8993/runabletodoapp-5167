export function timeAgo(d: Date | string | number) {
  const date = new Date(d);
  const s = Math.round((Date.now() - date.getTime()) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.round(h / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function initials(name?: string | null) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

const palette = ["#FF5B1F", "#2F6B4F", "#3B5BA9", "#B5832A", "#8A3E6B", "#1A1916"];
export function colorFor(seed?: string | null) {
  let h = 0;
  for (const ch of seed ?? "") h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return palette[h % palette.length];
}

export function formatDue(due: string | null | undefined) {
  if (!due) return null;
  const date = new Date(`${due}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  const label =
    diff === 0 ? "Today" : diff === 1 ? "Tomorrow" : diff === -1 ? "Yesterday" : date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return { label, overdue: diff < 0 };
}

export function errorMessage(err: unknown, fallback = "Something went wrong") {
  if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string")
    return (err as { message: string }).message || fallback;
  return fallback;
}
