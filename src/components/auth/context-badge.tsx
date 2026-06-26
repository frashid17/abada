"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Building2, Briefcase, Rocket } from "lucide-react";
import type { UserContext } from "@/types/database";
import { cn } from "@/lib/utils";

const contextConfig: Record<
  UserContext,
  { icon: typeof Rocket; href: string }
> = {
  founder: { icon: Rocket, href: "/registro?context=founder" },
  investor: { icon: Briefcase, href: "/registro?context=investor" },
  firm: { icon: Building2, href: "/registro?context=firm" },
};

type ContextBadgeProps = {
  active: UserContext;
};

export function ContextBadge({ active }: ContextBadgeProps) {
  const t = useTranslations("auth.context");
  const ActiveIcon = contextConfig[active].icon;

  return (
    <div className="space-y-3">
      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1.5 text-sm font-medium text-primary">
        <ActiveIcon className="h-4 w-4" aria-hidden />
        {t(active)}
      </div>
      <div className="flex flex-wrap gap-2">
        {(Object.keys(contextConfig) as UserContext[])
          .filter((key) => key !== active)
          .map((key) => {
            const Icon = contextConfig[key].icon;
            return (
              <Link
                key={key}
                href={contextConfig[key].href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg border border-border/70 px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" aria-hidden />
                {t(key)}
              </Link>
            );
          })}
      </div>
    </div>
  );
}
