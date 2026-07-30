import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { FounderFocusPriorityCard } from "@/components/founder/founder-focus-priority-card";
import { getFounderDashboardInsights } from "@/lib/documents/dashboard-insights";
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
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {t("dashboard.focusTitle")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("dashboard.focusDescription")}</p>
        </div>
        <Link
          href="/fundador/documentos"
          className="relative z-10 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-xs font-medium text-foreground shadow-soft transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-card"
        >
          {t("dashboard.browseAllDocuments")}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {next ? (
        <FounderFocusPriorityCard {...cardProps(next)} priority />
      ) : (
        <div className="relative overflow-hidden rounded-2xl border border-[color-mix(in_oklch,var(--risk-low)_35%,transparent)] bg-[color-mix(in_oklch,var(--risk-low)_8%,var(--surface))] px-5 py-8 text-center shadow-soft">
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-[color-mix(in_oklch,var(--risk-low)_20%,transparent)] blur-2xl"
            aria-hidden
          />
          <div className="relative mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[color-mix(in_oklch,var(--risk-low)_20%,transparent)] text-[color-mix(in_oklch,var(--risk-low)_55%,var(--fg))]">
            <CheckCircle2 className="h-6 w-6" aria-hidden />
          </div>
          <p className="relative mt-4 font-serif text-lg font-semibold text-foreground">
            {t("dashboard.allCompleteTitle")}
          </p>
          <p className="relative mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {t("dashboard.allCompleteDescription")}
          </p>
        </div>
      )}

      {alsoActive.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {t("dashboard.alsoInProgress")}
          </h3>
          <div className="space-y-2.5">
            {alsoActive.map((doc) => (
              <FounderFocusPriorityCard key={doc.documentType} {...cardProps(doc)} />
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
