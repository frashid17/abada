"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search } from "lucide-react";
import { LanguageToggle } from "./language-toggle";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

export type RoleView = "public" | "founder" | "investor" | "attorney";

const roleRoutes: { role: RoleView; href: string; labelKey: string }[] = [
  { role: "public", href: "/", labelKey: "nav.publicSite" },
  { role: "founder", href: "/fundador", labelKey: "nav.founder" },
  { role: "investor", href: "/inversionista", labelKey: "nav.investor" },
  { role: "attorney", href: "/abogado", labelKey: "nav.attorney" },
];

function detectRole(pathname: string): RoleView {
  if (pathname.startsWith("/fundador")) return "founder";
  if (pathname.startsWith("/inversionista")) return "investor";
  if (pathname.startsWith("/abogado")) return "attorney";
  return "public";
}

export function SiteHeader() {
  const pathname = usePathname();
  const { t } = useI18n();
  const currentRole = detectRole(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
              A
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              {t("common.brand")}
            </span>
          </Link>

          <nav className="hidden items-center gap-0.5 md:flex">
            {roleRoutes.map(({ role, href, labelKey }) => (
              <Link
                key={role}
                href={href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition",
                  currentRole === role
                    ? "bg-primary-subtle text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {t(labelKey)}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted sm:inline-flex"
            aria-label={t("common.search")}
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            type="button"
            className="hidden rounded-lg p-2 text-muted-foreground hover:bg-muted sm:inline-flex"
            aria-label={t("common.notifications")}
          >
            <Bell className="h-4 w-4" />
          </button>
          <Link
            href="/fundador"
            className="hidden rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted sm:inline-flex"
          >
            {t("common.login")}
          </Link>
          <Link
            href="/fundador"
            className="inline-flex h-9 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
          >
            {t("common.requestDemo")}
          </Link>
        </div>
      </div>
    </header>
  );
}
