import { getTranslations } from "next-intl/server";
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
        "relative flex flex-col bg-background",
        workspace ? "h-dvh overflow-hidden" : "min-h-dvh",
      )}
    >
      {variant === "public" ? <PageBackdrop /> : null}
      <header
        className={cn(
          "sticky top-0 z-50 border-b border-border bg-card",
          isApp ? "shadow-none" : "fixed inset-x-0 bg-background/95 shadow-soft backdrop-blur-md",
        )}
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-3 px-4 sm:px-5",
            isApp ? "h-[60px] max-w-[1240px]" : "h-14 max-w-7xl sm:h-16 sm:px-6",
          )}
        >
          <div className="flex min-w-0 items-center gap-2 sm:gap-4">
            <MobileNav items={nav} />
            <Link href={isApp ? nav[0]?.href ?? "/" : "/"} className="cursor-pointer">
              <BrandMark wordmark={t("brand")} className="[&>span]:hidden [&>span]:sm:inline" />
            </Link>
            {nav.length > 0 ? <ShellNav items={nav} /> : null}
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            {isApp ? (
              <span className="mr-1 hidden text-[12.5px] font-medium text-muted-foreground lg:inline">
                {firmName}
              </span>
            ) : (
              <span className="mr-1 hidden items-center gap-1.5 rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-xs font-medium text-primary lg:inline-flex">
                {firmName}
              </span>
            )}
            <LocaleSelector />
            <ThemeToggle />
            {isApp ? <NotificationBell /> : null}
            <AuthHeaderActions signInLabel={t("signIn")} />
          </div>
        </div>
      </header>
      <main
        className={cn(
          "relative z-0 mx-auto w-full grow",
          isApp ? "max-w-[1240px] px-4 sm:px-5" : "max-w-7xl px-4 sm:px-6",
          workspace
            ? "flex min-h-0 flex-col overflow-hidden pb-4 pt-4"
            : isApp
              ? "shrink-0 basis-auto pb-16 pt-6 sm:pb-20 sm:pt-8"
              : "shrink-0 basis-auto pb-16 pt-20 sm:pb-20 sm:pt-24",
        )}
      >
        {children}
      </main>
      {!workspace ? <SiteFooter variant={variant} /> : null}
    </div>
  );
}
