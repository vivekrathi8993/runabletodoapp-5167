import { Link } from "wouter";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative grid h-8 w-8 place-items-center rounded-md bg-ink text-card">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round">
          <path d="M5 6v12M9.5 6v12M14 6v12M18.5 4 4 20" className="[&]:stroke-current" />
        </svg>
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-tangerine" />
      </span>
      <span className="font-display text-[22px] font-semibold tracking-tight">Tally</span>
    </Link>
  );
}
