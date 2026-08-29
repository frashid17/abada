"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string };

type ShellNavProps = {
  items: ReadonlyArray<NavItem>;
  /** How many links to show before collapsing the rest into More. */
  maxVisible?: number;
};

function isActivePath(pathname: string, href: string): boolean {
  const sectionRoots = ["/fundador", "/firma", "/inversionista", "/admin"];
  if (sectionRoots.includes(href)) {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ShellNav({ items, maxVisible }: ShellNavProps) {
  const pathname = usePathname();
  const t = useTranslations("shell");
  const limit = maxVisible ?? items.length;
  const primary = items.slice(0, limit);
  const overflow = items.slice(limit);
  const overflowActive = overflow.some((item) => isActivePath(pathname, item.href));

  return (
    <nav className="hidden min-w-0 items-center gap-0.5 lg:flex">
      {primary.map((item) => {
        const active = isActivePath(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors xl:px-3 xl:text-[13.5px]",
              active
                ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
      {overflow.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className={cn(
                "h-auto gap-1 px-2.5 py-1.5 text-[13px] font-medium",
                overflowActive
                  ? "bg-card font-semibold text-foreground shadow-sm ring-1 ring-border"
                  : "text-muted-foreground",
              )}
            >
              {t("nav.more")}
              <ChevronDown className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-[11rem]">
            {overflow.map((item) => (
              <DropdownMenuItem key={item.href} asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "cursor-pointer",
                    isActivePath(pathname, item.href) && "font-semibold",
                  )}
                >
                  {item.label}
                </Link>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </nav>
  );
}
