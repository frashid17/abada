"use client";

import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { AccountMenu } from "@/components/auth/account-menu";
import { Button } from "@/components/ui/button";
import { useIsClient } from "@/hooks/use-is-client";

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
  showAdminLink?: boolean;
};

/**
 * Client-only auth chrome — avoids Clerk SignedIn/SignedOut hydration mismatches
 * with Radix dropdowns in AccountMenu.
 */
export function AuthHeaderActions({ signInLabel, showAdminLink = false }: AuthHeaderActionsProps) {
  const { isLoaded, userId } = useAuth();
  const mounted = useIsClient();
  const t = useTranslations("auth.account");

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

  return (
    <div className="flex items-center gap-1.5 sm:gap-2">
      {showAdminLink ? (
        <Button asChild variant="outline" size="sm" className="gap-1.5">
          <Link href="/admin">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">{t("adminButton")}</span>
          </Link>
        </Button>
      ) : null}
      <AccountMenu showAdminLink={showAdminLink} />
    </div>
  );
}
