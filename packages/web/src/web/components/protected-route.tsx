import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";
import { authClient } from "../lib/auth";

export function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center text-ink-soft">
      <Loader2 className="h-6 w-6 animate-spin" />
    </div>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  if (isPending) return <FullPageLoader />;
  if (!session) return <Redirect to="/" />;
  return <>{children}</>;
}
