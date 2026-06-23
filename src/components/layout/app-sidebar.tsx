"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import {
  FileText,
  FolderOpen,
  Home,
  LayoutTemplate,
  PenLine,
  Shield,
} from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
  badge?: number;
};

const navByRole: Record<
  "founder" | "investor" | "attorney",
  { sectionKey: string; items: NavItem[] }
> = {
  founder: {
    sectionKey: "founder.workspace",
    items: [
      { href: "/fundador", labelKey: "founder.home", icon: Home },
      { href: "/fundador/documentos", labelKey: "founder.documents", icon: FileText },
      { href: "/fundador/generar", labelKey: "founder.generate", icon: PenLine },
      { href: "/fundador/sala-de-datos", labelKey: "founder.dataRoom", icon: FolderOpen },
    ],
  },
  investor: {
    sectionKey: "investor.fund",
    items: [
      { href: "/inversionista", labelKey: "investor.operations", icon: Home },
      { href: "/inversionista/evaluacion", labelKey: "investor.riskEval", icon: Shield },
      { href: "/inversionista/sala-de-datos", labelKey: "investor.dataRoom", icon: FolderOpen },
    ],
  },
  attorney: {
    sectionKey: "attorney.work",
    items: [
      { href: "/abogado", labelKey: "attorney.reviewQueue", icon: Home, badge: 7 },
      { href: "/abogado/revision/nuvexa", labelKey: "attorney.caseReview", icon: Shield },
      { href: "/abogado/plantillas", labelKey: "attorney.templates", icon: LayoutTemplate },
    ],
  },
};

export function AppSidebar({
  role,
  userName,
  userRole,
}: {
  role: "founder" | "investor" | "attorney";
  userName: string;
  userRole: string;
}) {
  const pathname = usePathname();
  const { t } = useI18n();
  const config = navByRole[role];

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r border-border bg-surface">
      <div className="border-b border-border px-4 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          {t(config.sectionKey)}
        </p>
      </div>

      <nav className="flex-1 space-y-0.5 p-2">
        {config.items.map(({ href, labelKey, icon: Icon, badge }) => {
          const active =
            pathname === href ||
            (href !== config.items[0].href && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition",
                active
                  ? "bg-primary-subtle text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className={cn("h-4 w-4", active ? "text-primary" : "text-slate-400")} />
              <span className="flex-1">{t(labelKey)}</span>
              {badge ? (
                <span className="rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground">
                  {badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-lg bg-muted p-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-[10px] font-semibold text-accent-foreground">
            {userName
              .split(" ")
              .map((n) => n[0])
              .join("")
              .slice(0, 2)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{userName}</p>
            <p className="truncate text-xs text-muted-foreground">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
