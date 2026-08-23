"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type MobileNavProps = {
  items: ReadonlyArray<{ href: string; label: string }>;
};

export function MobileNav({ items }: MobileNavProps) {
  const t = useTranslations("shell");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [menuPathname, setMenuPathname] = useState(pathname);

  // Close the drawer when the route changes (render-time sync, not an effect).
  if (pathname !== menuPathname) {
    setMenuPathname(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div className="md:hidden">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="cursor-pointer"
        aria-label={open ? t("closeMenu") : t("openMenu")}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </Button>

      {open ? (
        <div className="fixed inset-0 top-16 z-40 md:hidden">
          <button
            type="button"
            aria-label={t("closeMenu")}
            className="absolute inset-0 cursor-pointer bg-background/70 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <nav
            aria-label={t("mobileNav")}
            className="absolute inset-x-0 top-0 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-card px-4 py-3 shadow-lg"
          >
            <ul className="space-y-1">
              {items.map((item) => {
                const isSectionRoot =
                  item.href === "/fundador" ||
                  item.href === "/firma" ||
                  item.href === "/inversionista";
                const active = isSectionRoot
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={cn(
                        "flex cursor-pointer items-center rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 font-semibold text-primary"
                          : "text-foreground hover:bg-accent",
                      )}
                      onClick={() => setOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      ) : null}
    </div>
  );
}
