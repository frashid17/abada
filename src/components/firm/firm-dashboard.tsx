import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  FolderSearch,
  ShieldCheck,
  Users,
} from "lucide-react";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalBadge } from "@/components/legal/legal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirmName } from "@/lib/brand";
import type { FirmDashboardData } from "@/lib/firm/dashboard";
import type { FirmMemberRole } from "@/lib/firm/membership";
import type { ReviewStatus } from "@/lib/firm/reviews";

type FirmDashboardProps = {
  data: FirmDashboardData;
};

type ModuleCardProps = {
  href: string;
  icon: typeof ClipboardList;
  title: string;
  description: string;
  cta: string;
  count?: number;
  countLabel?: string;
};

function ModuleCard({ href, icon: Icon, title, description, cta, count, countLabel }: ModuleCardProps) {
  return (
    <Link
      href={href}
      className="group relative flex flex-col rounded-2xl border border-border/80 bg-card p-5 shadow-soft transition hover:border-primary/30 hover:shadow-card"
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        {typeof count === "number" ? (
          <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-foreground">
            {count} {countLabel}
          </span>
        ) : null}
      </div>
      <h2 className="font-serif text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{description}</p>
      <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
        {cta}
        <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
      </span>
    </Link>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-trust-panel-accent/20 bg-trust-panel-icon-bg/60 px-4 py-3">
      <p className="text-2xl font-semibold tabular-nums text-trust-panel-foreground">{value}</p>
      <p className="mt-0.5 text-xs text-trust-panel-muted">{label}</p>
    </div>
  );
}

export async function FirmDashboard({ data }: FirmDashboardProps) {
  const t = await getTranslations("firm");
  const format = await getFormatter();
  const platformFirm = getFirmName();

  const statusLabels: Record<ReviewStatus, string> = {
    queued: t("queue.status.queued"),
    in_progress: t("queue.status.in_progress"),
    completed: t("queue.status.completed"),
    cancelled: t("queue.status.cancelled"),
  };

  const roleLabel = t(`team.roles.${data.role as FirmMemberRole}`);

  return (
    <div className="space-y-10">
      <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-trust-panel text-trust-panel-foreground shadow-card">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-trust-panel-accent/15 blur-3xl"
          aria-hidden
        />
        <div className="relative space-y-6 p-6 sm:p-8">
          <div className="flex flex-wrap items-center gap-2">
            <LegalBadge icon={ShieldCheck} label={platformFirm} variant="attorney" />
            <span className="rounded-md border border-trust-panel-accent/25 bg-trust-panel-icon-bg px-2.5 py-1 text-xs font-medium text-trust-panel-accent">
              {t("dashboard.roleLabel", { role: roleLabel })}
            </span>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-trust-panel-accent">
              {t("dashboard.eyebrow")}
            </p>
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {data.tenantName}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-trust-panel-muted sm:text-base">
              {t("dashboard.subtitle")}
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <StatPill label={t("dashboard.stats.pendingReviews")} value={data.stats.pendingReviews} />
            <StatPill label={t("dashboard.stats.completedReviews")} value={data.stats.completedReviews} />
            <StatPill label={t("dashboard.stats.activeDeals")} value={data.stats.activeDeals} />
            <StatPill label={t("dashboard.stats.teamMembers")} value={data.stats.teamMembers} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="font-serif text-xl font-semibold">{t("dashboard.modulesTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.modulesSubtitle")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <ModuleCard
            href="/firma/cola"
            icon={ClipboardList}
            title={t("queue.title")}
            description={t("dashboard.modules.queue.description")}
            cta={t("dashboard.modules.queue.cta")}
            count={data.stats.pendingReviews}
            countLabel={t("dashboard.modules.queue.countLabel")}
          />
          <ModuleCard
            href="/firma/dd"
            icon={FolderSearch}
            title={t("dd.title")}
            description={t("dashboard.modules.dd.description")}
            cta={t("dashboard.modules.dd.cta")}
            count={data.stats.activeDeals}
            countLabel={t("dashboard.modules.dd.countLabel")}
          />
          <ModuleCard
            href="/firma/equipo"
            icon={Users}
            title={t("team.title")}
            description={t("dashboard.modules.team.description")}
            cta={t("dashboard.modules.team.cta")}
            count={data.stats.teamMembers}
            countLabel={t("dashboard.modules.team.countLabel")}
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_300px] xl:items-start">
        <Card variant="elevated">
          <CardHeader>
            <CardTitle className="font-serif text-xl">{t("dashboard.recentActivity.title")}</CardTitle>
            <CardDescription>{t("dashboard.recentActivity.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentReviews.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border/80 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                {t("dashboard.recentActivity.empty")}
              </p>
            ) : (
              data.recentReviews.map((review) => (
                <Link
                  key={review.id}
                  href={`/firma/cola/${review.id}`}
                  className="flex items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 px-4 py-3 transition hover:border-primary/25 hover:bg-muted/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{review.documentTitle}</p>
                    <p className="text-xs text-muted-foreground">
                      {statusLabels[review.status]} ·{" "}
                      {format.dateTime(new Date(review.createdAt), { month: "short", day: "numeric" })}
                    </p>
                  </div>
                  <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                </Link>
              ))
            )}
            <Button asChild variant="outline" size="sm" className="mt-2">
              <Link href="/firma/cola">
                {t("dashboard.recentActivity.viewAll")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <aside className="space-y-4">
          <FeaturePanel
            tone="trust"
            icon={Users}
            eyebrow={data.tenantName}
            title={t("dashboard.invitePanel.title")}
            description={t("dashboard.invitePanel.description")}
            className="p-5"
          >
            {data.isAdmin ? (
              <Button asChild variant="outline" size="sm" className="mt-2 w-full">
                <Link href="/firma/equipo">
                  {t("dashboard.teamCta")}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}
          </FeaturePanel>
        </aside>
      </div>
    </div>
  );
}
