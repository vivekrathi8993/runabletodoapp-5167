import { useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { Logo } from "./brand";
import { Avatar } from "./avatar";
import { authClient, clearToken } from "../lib/auth";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await authClient.signOut();
    clearToken();
    qc.clear();
    navigate("/");
  };

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-line/80 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8">
          <Logo />
          <div className="relative">
            <button
              onClick={() => setOpen((o) => !o)}
              className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 transition hover:bg-paper-2"
            >
              <Avatar name={session?.user.name} size={30} />
              <span className="hidden text-sm font-medium sm:block">{session?.user.name}</span>
            </button>
            {open && (
              <>
                <button type="button" aria-label="Close menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
                <div className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-line bg-card p-1.5 shadow-lg">
                  <div className="px-3 py-2">
                    <div className="truncate text-sm font-medium">{session?.user.name}</div>
                    <div className="truncate text-xs text-ink-soft">{session?.user.email}</div>
                  </div>
                  <div className="my-1 h-px bg-line" />
                  <button
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm hover:bg-paper-2"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 sm:px-8">{children}</main>
    </div>
  );
}
