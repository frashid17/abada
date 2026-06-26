import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { FounderFocusPriorityCard } from "@/components/founder/founder-focus-priority-card";
import {
  getFounderDashboardInsights,
} from "@/lib/documents/dashboard-insights";
import type { FounderDashboardData } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";

function formatUpdatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

type FounderWorkspaceFocusProps = {
  data: FounderDashboardData;
};

export async function FounderWorkspaceFocus({ data }: FounderWorkspaceFocusProps) {
  const t = await getTranslations("founder");
  const locale = await getLocale();
  const insights = getFounderDashboardInsights(data);
  const next = insights.nextDocument;

  const statusLabels = Object.fromEntries(
    (["not_started", "draft", "flagged", "in_review", "complete"] as DocumentStatus[]).map(
      (status) => [status, t(`dashboard.status.${status}`)],
    ),
  ) as Record<DocumentStatus, string>;

  const alsoActive = data.documents.filter(
    (doc) =>
      doc.documentType !== next?.documentType &&
      ["draft", "flagged", "in_review"].includes(doc.status),
  );

  const cardProps = (doc: (typeof data.documents)[number]) => ({
    doc,
    title: t(`documents.${doc.documentType}.title`),
    description: t(`documents.${doc.documentType}.description`),
    statusLabel: statusLabels[doc.status],
    stepLabel: t("dashboard.step", { step: doc.step }),
    startLabel: t("dashboard.startDocument"),
    viewLabel: t("dashboard.viewDocument"),
    updatedLabel: t("dashboard.updated", {
      date: formatUpdatedAt(doc.updatedAt, locale),
    }),
  });

  return (
    <section className="space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-0.5">
          <h2 className="font-serif text-lg font-semibold tracking-tight text-foreground">
            {t("dashboard.focusTitle")}
          </h2>
          <p className="text-xs text-muted-foreground sm:text-sm">{t("dashboard.focusDescription")}</p>
        </div>
        <Link
          href="/fundador/documentos"
          className="relative z-10 inline-flex shrink-0 items-center gap-1 rounded-lg border border-border/70 bg-background/60 px-2.5 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-primary/30 hover:bg-muted/50"
        >
          {t("dashboard.browseAllDocuments")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {next ? (
        <FounderFocusPriorityCard {...cardProps(next)} priority />
      ) : (
        <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-6 text-center">
          <p className="font-serif text-base font-semibold text-foreground">
            {t("dashboard.allCompleteTitle")}
          </p>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            {t("dashboard.allCompleteDescription")}
          </p>
        </div>
      )}

      {alsoActive.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            {t("dashboard.alsoInProgress")}
          </h3>
          <div className="space-y-2">
            {alsoActive.map((doc) => (
              <FounderFocusPriorityCard key={doc.documentType} {...cardProps(doc)} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
