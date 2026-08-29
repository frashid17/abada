"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type NavItem = { href: string; label: string };

type AdminSideNavProps = {
  items: ReadonlyArray<NavItem>;
  title: string;
};

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSideNav({ items, title }: AdminSideNavProps) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-56 shrink-0 border-r border-border bg-card md:block lg:w-60">
      <div className="sticky top-[60px] flex h-[calc(100dvh-60px)] flex-col">
        <p className="px-4 pb-2 pt-5 text-[10.5px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          {title}
        </p>
        <nav className="flex-1 overflow-y-auto px-2 pb-6" aria-label={title}>
          <ul className="space-y-0.5">
            {items.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block cursor-pointer rounded-lg px-3 py-2 text-[13.5px] font-medium transition-colors",
                      active
                        ? "bg-accent-soft font-semibold text-foreground ring-1 ring-border"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
