import { getTranslations } from "next-intl/server";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";
import { AuthHeaderActions } from "@/components/auth/auth-header-actions";
import { BrandMark } from "@/components/brand/brand-mark";
import { LocaleSelector } from "@/components/layout/locale-selector";
import { PageBackdrop } from "@/components/layout/page-backdrop";
import { SiteFooter } from "@/components/layout/site-footer";
import { ShellNav } from "@/components/layout/shell-nav";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { getFirmName } from "@/lib/brand";

type AppShellProps = {
  children: React.ReactNode;
  variant: "public" | "founder" | "investor" | "firm";
};

const navKeys = {
  public: [],
  founder: [
    { href: "/fundador", key: "dashboard" },
    { href: "/fundador/documentos", key: "documents" },
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
} as const;

export async function AppShell({ children, variant }: AppShellProps) {
  const t = await getTranslations("shell");
  const firmName = getFirmName();
  const nav = navKeys[variant].map((item) => ({
    href: item.href,
    label: t(`nav.${item.key}`),
  }));

  return (
    <div className="relative flex min-h-dvh flex-col">
      <PageBackdrop />
      <header className="fixed inset-x-0 top-0 z-50 border-b border-border bg-background/95 shadow-soft backdrop-blur-md supports-[backdrop-filter]:bg-background/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-5">
            <Link href="/" className="cursor-pointer transition-opacity hover:opacity-90">
              <BrandMark wordmark={t("brand")} />
            </Link>
            {nav.length > 0 ? <ShellNav items={nav} /> : null}
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-1 hidden items-center gap-1.5 rounded-md border border-primary/15 bg-primary/5 px-2 py-1 text-xs font-medium text-primary lg:inline-flex">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
              {firmName}
            </span>
            <LocaleSelector />
            <ThemeToggle />
            <AuthHeaderActions signInLabel={t("signIn")} />
          </div>
        </div>
      </header>
      <main className="relative z-0 mx-auto w-full max-w-7xl grow shrink-0 basis-auto px-4 pb-16 pt-24 sm:px-6 sm:pb-20">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}
