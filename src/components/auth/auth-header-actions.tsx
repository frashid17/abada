"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useEffect, useState } from "react";
import { AccountMenu } from "@/components/auth/account-menu";
import { Button } from "@/components/ui/button";

export function AuthHeaderPlaceholder() {
  return (
    <div
      className="h-8 w-[7.5rem] animate-pulse rounded-md border border-border bg-muted/50"
      aria-hidden
    />
  );
}

type AuthHeaderActionsProps = {
  signInLabel: string;
};

/**
 * Client-only auth chrome — avoids Clerk SignedIn/SignedOut hydration mismatches
 * with Radix dropdowns in AccountMenu.
 */
export function AuthHeaderActions({ signInLabel }: AuthHeaderActionsProps) {
  const { isLoaded, userId } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted || !isLoaded) {
    return <AuthHeaderPlaceholder />;
  }

  if (!userId) {
    return (
      <Button variant="outline" size="sm" asChild>
        <Link href="/iniciar-sesion">{signInLabel}</Link>
      </Button>
    );
  }

  return <AccountMenu />;
}
