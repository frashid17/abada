"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronLeft, Fingerprint, Scale, ShieldCheck } from "lucide-react";
import { BrandMark } from "@/components/brand/brand-mark";
import { LocaleSelector } from "@/components/layout/locale-selector";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { LegalBadge } from "@/components/legal/legal-badge";
import { AuthSessionGate } from "@/components/auth/auth-session-gate";
import { getFirmName } from "@/lib/brand";

type AuthShellProps = {
  children: React.ReactNode;
};

export function AuthShell({ children }: AuthShellProps) {
  const t = useTranslations("auth.shell");
  const tShell = useTranslations("shell");
  const firmName = getFirmName();

  return (
    <div className="relative min-h-screen bg-background">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cta/10 blur-3xl" />
      </div>

      <div className="relative grid min-h-screen lg:grid-cols-2">
        <aside className="relative hidden flex-col justify-between border-r border-border/70 bg-trust-panel p-10 text-trust-panel-foreground lg:flex">
          <div className="absolute inset-0 opacity-30">
            <svg className="h-full w-full" viewBox="0 0 696 316" fill="none" aria-hidden>
              {Array.from({ length: 12 }, (_, i) => (
                <path
                  key={i}
                  d={`M-${380 - i * 12} -${189 + i * 14}C-${380 - i * 12} -${189 + i * 14} -${312 - i * 12} ${216 - i * 14} ${152 - i * 12} ${343 - i * 14}C${616 - i * 12} ${470 - i * 14} ${684 - i * 12} ${875 - i * 14} ${684 - i * 12} ${875 - i * 14}`}
                  stroke="currentColor"
                  strokeWidth={0.5 + i * 0.04}
                  strokeOpacity={0.12 + i * 0.02}
                />
              ))}
            </svg>
          </div>

          <div className="relative z-10">
            <BrandMark wordmark={tShell("brand")} className="[&_div]:bg-trust-panel-icon-bg [&_div]:text-trust-panel-accent [&_span]:text-trust-panel-fg" />
            <div className="mt-8 flex flex-wrap gap-2">
              <LegalBadge
                icon={ShieldCheck}
                label={firmName}
                variant="attorney"
                className="border-trust-panel-accent/30 bg-trust-panel-icon-bg text-trust-panel-accent"
              />
              <LegalBadge
                icon={Fingerprint}
                label={t("auditBadge")}
                variant="confidential"
                className="border-trust-panel-accent/20 bg-trust-panel-icon-bg/80 text-trust-panel-muted"
              />
            </div>
          </div>

          <blockquote className="relative z-10 space-y-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-trust-panel-icon-bg text-trust-panel-accent">
              <Scale className="h-5 w-5" aria-hidden />
            </div>
            <p className="font-serif text-2xl leading-snug text-trust-panel-fg">{t("quote")}</p>
            <footer className="text-sm text-trust-panel-muted">{t("quoteAttribution")}</footer>
          </blockquote>
        </aside>

        <div className="relative flex min-h-screen flex-col">
          <header className="flex items-center justify-between gap-3 px-4 py-4 sm:px-6">
            <ButtonLink href="/" label={t("backHome")} />
            <div className="flex items-center gap-2">
              <LocaleSelector />
              <ThemeToggle />
            </div>
          </header>

          <main className="flex flex-1 flex-col items-center justify-center px-4 pb-10 sm:px-6">
            <AuthSessionGate>
              <div className="w-full max-w-md">{children}</div>
            </AuthSessionGate>
          </main>
        </div>
      </div>
    </div>
  );
}

function ButtonLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      <ChevronLeft className="h-4 w-4" aria-hidden />
      {label}
    </Link>
  );
}
