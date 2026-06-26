"use client";

import { useAuth, useClerk } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { resetClerkClientSession } from "@/lib/auth/clear-session";

type AuthSessionGateProps = {
  children: React.ReactNode;
};

/**
 * Auth pages are server-rendered only when there is no Clerk session. Clear a
 * stale client session (common after failed OAuth) before showing forms — but do
 * not sign out visitors who are already signed out (that breaks OAuth flows).
 */
export function AuthSessionGate({ children }: AuthSessionGateProps) {
  const { isLoaded, userId } = useAuth();
  const { signOut } = useClerk();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;

    let alive = true;

    async function prepare() {
      if (userId) {
        await resetClerkClientSession(signOut);
      }
      if (alive) setReady(true);
    }

    void prepare();

    return () => {
      alive = false;
    };
  }, [isLoaded, userId, signOut]);

  if (!isLoaded || !ready) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return children;
}
