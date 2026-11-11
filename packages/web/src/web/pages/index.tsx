import { useState } from "react";
import { Redirect, useLocation } from "wouter";
import { motion } from "motion/react";
import { ArrowRight, Check, Loader2, Users, History, Gauge } from "lucide-react";
import { Logo } from "../components/brand";
import { Avatar } from "../components/avatar";
import { FullPageLoader } from "../components/protected-route";
import { authClient } from "../lib/auth";

const fade = (i: number) => ({
  initial: { opacity: 0, y: 18 },
  animate: { opacity: 1, y: 0 },
  transition: { delay: 0.08 + i * 0.07, duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
});

function AuthCard() {
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res =
      mode === "signup"
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
    setLoading(false);
    if (res.error) {
      setError(res.error.message ?? "Could not sign you in");
      return;
    }
    navigate("/app");
  };

  return (
    <div className="paper-shadow rounded-xl border-2 border-ink bg-card p-6 sm:p-8">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-paper-2 p-1 text-sm font-medium">
        {(["signup", "signin"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError(null);
            }}
            className={`rounded-md py-2 transition ${mode === m ? "bg-card text-ink shadow-sm" : "text-ink-soft hover:text-ink"}`}
          >
            {m === "signup" ? "Create account" : "Sign in"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="space-y-4">
        {mode === "signup" && (
          <label className="block">
            <span className="label mb-1.5 block">Your name</span>
            <input aria-label="Your name" className="field" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ada Lovelace" autoComplete="name" />
          </label>
        )}
        <label className="block">
          <span className="label mb-1.5 block">Email</span>
          <input aria-label="Email" className="field" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" autoComplete="email" />
        </label>
        <label className="block">
          <span className="label mb-1.5 block">Password</span>
          <input aria-label="Password"
            className="field"
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "At least 8 characters" : "••••••••"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
          />
        </label>
        {error && <p className="rounded-md bg-tangerine-soft px-3 py-2 text-sm text-danger">{error}</p>}
        <button
          disabled={loading}
          className="group flex w-full items-center justify-center gap-2 rounded-lg bg-ink py-3 text-[15px] font-medium text-card transition hover:bg-tangerine disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {mode === "signup" ? "Start tallying" : "Sign in"}
          {!loading && <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />}
        </button>
      </form>
    </div>
  );
}

function DemoList() {
  const rows = [
    { t: "Draft launch announcement", s: "Done", p: 100, who: "Maya Chen" },
    { t: "Record product walkthrough", s: "In progress", p: 65, who: "Leo Park" },
    { t: "Book venue for team offsite", s: "In progress", p: 30, who: "Maya Chen" },
    { t: "Review pricing page copy", s: "To do", p: 0, who: "Sam Ortiz" },
  ];
  return (
    <div className="rounded-xl border border-line bg-card/90 p-5 shadow-[0_30px_60px_-30px_rgba(26,25,22,0.35)]">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="label">Shared list</div>
          <div className="font-display text-xl font-semibold">Spring launch</div>
        </div>
        <div className="flex -space-x-2">
          {["Maya Chen", "Leo Park", "Sam Ortiz"].map((n) => (
            <Avatar key={n} name={n} size={28} ring />
          ))}
        </div>
      </div>
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.t} className="rounded-lg border border-line/80 bg-paper/50 px-3.5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className={`grid h-4 w-4 place-items-center rounded-full border-2 ${r.p === 100 ? "border-moss bg-moss text-white" : "border-ink-soft/50"}`}>
                  {r.p === 100 && <Check className="h-2.5 w-2.5" strokeWidth={4} />}
                </span>
                <span className={`text-sm ${r.p === 100 ? "text-ink-soft line-through" : ""}`}>{r.t}</span>
              </div>
              <span className="tabular font-display text-sm">{r.p}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-paper-2">
              <div className={`h-full ${r.p === 100 ? "bg-moss" : "bg-tangerine"}`} style={{ width: `${r.p}%` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-center gap-2 border-t border-line pt-3 text-xs text-ink-soft">
        <Avatar name="Leo Park" size={18} />
        <span>
          <b className="font-medium text-ink">Leo</b> moved progress 40% → 65% · just now
        </span>
      </div>
    </div>
  );
}

export default function Index() {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <FullPageLoader />;
  if (session) return <Redirect to="/app" />;

  return (
    <div className="min-h-screen overflow-hidden">
      <header className="mx-auto flex h-20 max-w-[1180px] items-center justify-between px-5 sm:px-8">
        <Logo />
        <span className="hidden text-sm text-ink-soft sm:block">Shared todos that remember every step.</span>
      </header>

      <section className="ruled relative mx-auto grid max-w-[1180px] gap-12 px-5 pb-20 pt-8 sm:px-8 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16">
        <div>
          <motion.div {...fade(0)} className="label mb-5 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3 py-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-tangerine" /> Track · Share · Finish
          </motion.div>
          <motion.h1 {...fade(1)} className="font-display text-[48px] font-semibold leading-[1.02] tracking-tight sm:text-[72px]">
            Every todo,
            <br />
            <span className="italic text-tangerine">counted</span> to done.
          </motion.h1>
          <motion.p {...fade(2)} className="mt-6 max-w-xl text-lg leading-relaxed text-ink-soft">
            Tally keeps your lists, their progress, and the full history of who changed what. Invite teammates or
            family to a list and work through it together.
          </motion.p>

          <motion.div {...fade(3)} className="mt-10 grid max-w-xl gap-5 sm:grid-cols-3">
            {[
              { icon: Gauge, t: "Real progress", d: "Status plus a 0–100% slider on every item." },
              { icon: Users, t: "Collaborate", d: "Share a list with anyone who has an account." },
              { icon: History, t: "Never forget", d: "Every update is saved with who and when." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t}>
                <Icon className="mb-2 h-5 w-5 text-tangerine" />
                <div className="text-sm font-semibold">{t}</div>
                <div className="mt-1 text-sm leading-relaxed text-ink-soft">{d}</div>
              </div>
            ))}
          </motion.div>

          <motion.div {...fade(4)} className="mt-12 hidden lg:block lg:max-w-md">
            <DemoList />
          </motion.div>
        </div>

        <motion.div {...fade(2)} className="lg:sticky lg:top-10 lg:self-start">
          <AuthCard />
          <p className="mt-4 text-center text-xs text-ink-soft">Your lists are saved to your account and sync across devices.</p>
        </motion.div>
      </section>
    </div>
  );
}
