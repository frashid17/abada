"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type ShellNavProps = {
  items: ReadonlyArray<{ href: string; label: string }>;
};

export function ShellNav({ items }: ShellNavProps) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 md:flex">
      {items.map((item) => {
        const isSectionRoot = item.href === "/fundador" || item.href === "/firma" || item.href === "/inversionista";
        const active = isSectionRoot
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-200",
              active
                ? "bg-primary/10 font-semibold text-primary"
                : "text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
