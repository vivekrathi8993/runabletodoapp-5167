import { colorFor, initials } from "../lib/format";

export function Avatar({ name, size = 32, ring = false }: { name?: string | null; size?: number; ring?: boolean }) {
  return (
    <span
      title={name ?? undefined}
      className={`inline-grid shrink-0 place-items-center rounded-full font-medium text-white ${ring ? "ring-2 ring-paper" : ""}`}
      style={{ width: size, height: size, background: colorFor(name), fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(name)}
    </span>
  );
}

export function AvatarStack({ names, size = 26, max = 4 }: { names: string[]; size?: number; max?: number }) {
  const shown = names.slice(0, max);
  return (
    <span className="flex -space-x-2">
      {shown.map((n, i) => (
        <Avatar key={`${n}-${i}`} name={n} size={size} ring />
      ))}
      {names.length > max && (
        <span
          className="inline-grid place-items-center rounded-full bg-paper-2 text-[11px] font-medium text-ink-soft ring-2 ring-paper"
          style={{ width: size, height: size }}
        >
          +{names.length - max}
        </span>
      )}
    </span>
  );
}
