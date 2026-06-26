"use client";

import { useClerk } from "@clerk/nextjs";
import { clearClerkSessionRepairFlag } from "@/lib/auth/session-repair";

/** Clears any client-side Clerk session (orphan cookies, half-finished OAuth, etc.). */
export async function resetClerkClientSession(
  signOut: () => Promise<void>,
  options?: { reload?: boolean },
): Promise<void> {
  clearClerkSessionRepairFlag();
  try {
    await signOut();
  } catch {
    // No active session — still continue so auth forms can mount cleanly.
  }

  if (options?.reload && typeof window !== "undefined") {
    window.location.reload();
  }
}

export function useResetClerkClientSession() {
  const { signOut } = useClerk();
  return (options?: { reload?: boolean }) => resetClerkClientSession(signOut, options);
}
