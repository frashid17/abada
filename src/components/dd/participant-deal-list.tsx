import { getFormatter, getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, FileText, FolderOpen, Shield } from "lucide-react";
import type { DealRecord } from "@/lib/deals/types";
import type { DealRoomSummary } from "@/lib/deals/summaries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type ParticipantDealListProps = {
  deals: DealRecord[];
  summaries: Map<string, DealRoomSummary>;
  basePath: "/fundador/sala" | "/inversionista/salas";
  variant: "founder" | "investor";
};

export async function ParticipantDealList({
  deals,
  summaries,
  basePath,
  variant,
}: ParticipantDealListProps) {
  const t = await getTranslations(variant === "founder" ? "founder.sala" : "investor.room");
  const format = await getFormatter();

  if (deals.length === 0) {
    return (
      <Card variant="elevated" className="max-w-2xl">
        <CardContent className="space-y-3 p-8 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <FolderOpen className="h-6 w-6" />
          </div>
          <p className="font-medium text-foreground">{t("emptyTitle")}</p>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {deals.map((deal) => {
        const summary = summaries.get(deal.id);
        const coveragePct = summary
          ? Math.round((summary.categoriesCovered / summary.totalCategories) * 100)
          : 0;

        return (
          <Card key={deal.id} variant="elevated" className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <FolderOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base">{deal.name}</CardTitle>
                    <CardDescription>
                      {format.dateTime(new Date(deal.createdAt), { dateStyle: "medium" })}
                    </CardDescription>
                  </div>
                </div>
                <span
                  className={cn(
                    "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                    deal.status === "active"
                      ? "border-risk-low/30 bg-risk-low/10 text-risk-low"
                      : "border-border bg-muted text-muted-foreground",
                  )}
                >
                  {deal.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="mt-auto space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                  <p className="flex items-center gap-1 text-muted-foreground">
                    <FileText className="h-3.5 w-3.5" />
                    {t("documentCount", { count: summary?.documentCount ?? 0 })}
                  </p>
                </div>
                {variant === "founder" ? (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                    <p className="text-muted-foreground">
                      {t("categoryCoverage", {
                        covered: summary?.categoriesCovered ?? 0,
                        total: summary?.totalCategories ?? 9,
                      })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border/70 bg-muted/30 px-3 py-2">
                    <p className="flex items-center gap-1 text-muted-foreground">
                      <Shield className="h-3.5 w-3.5" />
                      {t("findingCount", { count: summary?.findingCount ?? 0 })}
                    </p>
                  </div>
                )}
              </div>

              {variant === "founder" ? (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{t("uploadProgress")}</span>
                    <span>{coveragePct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                </div>
              ) : summary?.hasPublishedAssessment ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-risk-low">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  {t("assessmentReady")}
                </p>
              ) : (
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {t("assessmentPending")}
                </p>
              )}

              <Link
                href={`${basePath}/${deal.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("openDeal")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
