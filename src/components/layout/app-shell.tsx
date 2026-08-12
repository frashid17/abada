import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { LocaleSelector } from "@/components/layout/locale-selector";
import { MobileNav } from "@/components/layout/mobile-nav";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShellNav } from "@/components/layout/shell-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { getFirmName } from "@/lib/brand";
import { cn } from "@/lib/utils";

type AppShellProps = {
  children: React.ReactNode;
  variant: "public" | "founder" | "investor" | "firm" | "admin";
  /** Full-height workspace (independent panes); hides marketing footer. */
  workspace?: boolean;
};

const navKeys = {
  public: [{ href: "/conocimiento", key: "knowledge" }],
  founder: [
    { href: "/fundador", key: "dashboard" },
    { href: "/fundador/documentos", key: "documents" },
    { href: "/fundador/plantillas", key: "templates" },
    { href: "/fundador/leyes", key: "laws" },
    { href: "/fundador/sala", key: "dataRoom" },
  ],
  investor: [
    { href: "/inversionista", key: "dashboard" },
    { href: "/inversionista/salas", key: "rooms" },
  ],
  firm: [
    { href: "/firma", key: "dashboard" },
    { href: "/firma/cola", key: "queue" },
    { href: "/firma/dd", key: "dd" },
    { href: "/firma/equipo", key: "team" },
  ],
  admin: [
    { href: "/admin", key: "adminOverview" },
    { href: "/admin/corpus", key: "adminCorpus" },
    { href: "/admin/ai", key: "adminAi" },
    { href: "/admin/requests", key: "adminRequests" },
    { href: "/admin/audit", key: "adminAudit" },
  ],
} as const;

export async function AppShell({ children, variant, workspace = false }: AppShellProps) {
  const t = await getTranslations("shell");
  const firmName = getFirmName();
  const nav = navKeys[variant].map((item) => ({
    href: item.href,
    label: t(`nav.${item.key}`),
  }));
  const isApp = variant !== "public";

  return (
    <div
      className={cn(
        "relative flex flex-col",
        workspace ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      <PageBackdrop />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:h-16 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-5">
            <MobileNav items={nav} />
            <Link href="/" className="cursor-pointer transition-opacity hover:opacity-90">
              <BrandMark wordmark={t("brand")} className="[&>span]:hidden [&>span]:sm:inline" />
            </Link>
            {nav.length > 0 ? <ShellNav items={nav} /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="mr-1 hidden items-center gap-1.5 rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-xs font-medium text-primary lg:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {firmName}
            </span>
            <LocaleSelector />
            <ThemeToggle />
            {isApp ? <NotificationBell /> : null}
            <AuthHeaderActions signInLabel={t("signIn")} />
          </div>
        </div>
      </header>
      <main
        className={cn(
          "relative z-0 mx-auto w-full max-w-7xl grow px-4 sm:px-6",
          workspace
            ? "flex min-h-0 flex-col overflow-hidden pb-4 pt-[4.25rem] sm:pt-[5rem]"
            : "shrink-0 basis-auto pb-16 pt-20 sm:pb-20 sm:pt-24",
        )}
      >
        {children}
      </main>
      {!workspace && !isApp ? <SiteFooter /> : null}
      {!workspace && isApp ? (
        <footer className="relative z-0 border-t border-border/60 py-4 text-center text-xs text-muted-foreground">
          {firmName}
        </footer>
      ) : null}
    </div>
  );
}
