import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ParticipantDealList } from "@/components/dd/participant-deal-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDealRoomSummaries } from "@/lib/deals/summaries";
import { listDealsForParticipant } from "@/lib/deals/service";

export default async function InvestorDashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/inversionista");

  const t = await getTranslations("investor");
  const deals = await listDealsForParticipant(userId, "investor");
  const summaries = await getDealRoomSummaries(deals.map((deal) => deal.id));
  const publishedCount = [...summaries.values()].filter((summary) => summary.hasPublishedAssessment).length;

  return (
    <AppShell variant="investor">
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("dashboard.eyebrow")}
          title={t("dashboard.title")}
          description={t("dashboard.subtitle")}
        />

        {deals.length === 0 ? (
          <Card variant="elevated" className="max-w-2xl">
            <CardHeader>
              <CardTitle>{t("dashboard.emptyTitle")}</CardTitle>
              <CardDescription>{t("dashboard.emptyDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed text-muted-foreground">{t("dashboard.emptyBody")}</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{deals.length}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.activeRooms")}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">{publishedCount}</p>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.assessments")}</p>
              </div>
              <div className="rounded-xl border border-border/70 bg-muted/30 px-4 py-3">
                <p className="text-2xl font-semibold tabular-nums">
                  {[...summaries.values()].reduce((sum, item) => sum + item.findingCount, 0)}
                </p>
                <p className="text-xs text-muted-foreground">{t("dashboard.stats.findings")}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-serif text-xl font-semibold">{t("dashboard.recentRooms")}</h2>
                <Button asChild variant="outline" size="sm">
                  <Link href="/inversionista/salas">
                    {t("dashboard.viewAllRooms")}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
              <ParticipantDealList
                deals={deals.slice(0, 4)}
                summaries={summaries}
                basePath="/inversionista/salas"
                variant="investor"
              />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
