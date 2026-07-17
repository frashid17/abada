import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import {
  BookOpen,
  Bot,
  ClipboardList,
  FileSearch,
  Plus,
  ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { UserCell } from "@/components/admin/user-cell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import {
  getAdminDashboardFeed,
  getAdminOverviewCounts,
} from "@/lib/platform-admin/service";

export default async function AdminOverviewPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin");
  const [counts, feed] = await Promise.all([
    getAdminOverviewCounts(),
    getAdminDashboardFeed(),
  ]);

  const cards = [
    {
      href: "/admin/corpus",
      label: t("stats.corpus"),
      value: counts.corpusSources,
      hint: t("stats.visibleHint", { count: counts.visibleSources }),
      icon: BookOpen,
    },
    {
      href: "/admin/ai",
      label: t("stats.aiCalls"),
      value: counts.aiCalls,
      hint: t("stats.aiHint"),
      icon: Bot,
    },
    {
      href: "/admin/requests",
      label: t("stats.openReviews"),
      value: counts.openReviews,
      hint: t("stats.reviewsHint"),
      icon: FileSearch,
    },
    {
      href: "/admin/audit",
      label: t("stats.auditEvents"),
      value: counts.auditEvents,
      hint: t("stats.auditHint"),
      icon: ClipboardList,
    },
  ];

  const shortcuts = [
    {
      href: "/admin/corpus?crear=1",
      title: t("overview.addLaw"),
      description: t("overview.addLawDescription"),
      icon: Plus,
    },
    {
      href: "/admin/corpus",
      title: t("overview.manageCorpus"),
      description: t("overview.manageCorpusDescription"),
      icon: BookOpen,
    },
    {
      href: "/admin/audit",
      title: t("overview.viewAudit"),
      description: t("overview.viewAuditDescription"),
      icon: ClipboardList,
    },
  ];

  return (
    <AppShell variant="admin">
      <div className="space-y-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
          <Button asChild variant="cta" className="shrink-0 self-start sm:self-auto">
            <Link href="/admin/corpus?crear=1">
              <Plus className="size-4" />
              {t("overview.addLaw")}
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Link key={card.href} href={card.href} className="group">
                <Card
                  variant="elevated"
                  className="h-full border-border/50 transition-colors group-hover:border-primary/40"
                >
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.label}
                    </CardTitle>
                    <Icon className="size-4 text-muted-foreground/70" />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p className="font-serif text-3xl font-semibold tabular-nums tracking-tight">
                      {card.value}
                    </p>
                    <p className="text-xs text-muted-foreground">{card.hint}</p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{t("overview.shortcutsTitle")}</h2>
          <div className="grid gap-3 md:grid-cols-3">
            {shortcuts.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-3 rounded-xl border border-border/60 bg-muted/20 p-4 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="mt-0.5 rounded-lg border border-border/50 bg-background p-2">
                    <Icon className="size-4 text-primary" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-1">
                    <span className="flex items-center gap-2 font-medium text-foreground">
                      {item.title}
                      <ArrowRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                    </span>
                    <span className="block text-sm text-muted-foreground">{item.description}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-serif text-lg">{t("overview.recentActivity")}</CardTitle>
                <CardDescription>{t("overview.recentActivityDescription")}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/audit">{t("overview.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {feed.recentAudit.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("audit.empty")}</p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {feed.recentAudit.map((row) => (
                    <li key={row.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{row.action}</p>
                        <UserCell name={row.actorName} email={row.actorEmail} />
                      </div>
                      <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="font-serif text-lg">{t("overview.recentAi")}</CardTitle>
                <CardDescription>{t("overview.recentAiDescription")}</CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/admin/ai">{t("overview.viewAll")}</Link>
              </Button>
            </CardHeader>
            <CardContent>
              {feed.recentAi.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t("ai.empty")}</p>
              ) : (
                <ul className="divide-y divide-border/50">
                  {feed.recentAi.map((row) => (
                    <li key={row.id} className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 space-y-1">
                        <p className="truncate text-sm font-medium">{row.task}</p>
                        <UserCell name={row.callerName} email={row.callerEmail} />
                      </div>
                      <time className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </time>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
