"use client";

import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { FounderFocusPriorityCard } from "@/components/founder/founder-focus-priority-card";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import type { FounderDashboardInsights } from "@/lib/documents/dashboard-insights";

type FounderWorkspaceFocusClientProps = {
  documents: DashboardDocument[];
  documentTitles: Record<string, string>;
  documentDescriptions: Record<string, string>;
  hrefById: Record<string, string>;
  insights: FounderDashboardInsights;
  statusLabels: Record<DocumentStatus, string>;
  labels: {
    title: string;
    description: string;
    browseAllDocuments: string;
    alsoInProgress: string;
    allCompleteTitle: string;
    allCompleteDescription: string;
    startDocument: string;
    viewDocument: string;
    stepLabel: (step: number) => string;
  };
};

export function FounderWorkspaceFocusClient({
  documents,
  documentTitles,
  documentDescriptions,
  hrefById,
  insights,
  statusLabels,
  labels,
}: FounderWorkspaceFocusClientProps) {
  const next = insights.nextDocument;

  const alsoActive = documents.filter(
    (doc) =>
      doc.documentType !== next?.documentType &&
      ["draft", "flagged", "in_review"].includes(doc.status),
  );

  const cardProps = (doc: DashboardDocument) => ({
    doc,
    title: documentTitles[doc.documentType] ?? doc.documentType,
    description: documentDescriptions[doc.documentType] ?? "",
    statusLabel: statusLabels[doc.status],
    stepLabel: labels.stepLabel(doc.step),
    startLabel: labels.startDocument,
    viewLabel: labels.viewDocument,
    updatedLabel: "",
    href: hrefById[doc.documentType] ?? `/fundador/documentos/preparacion/${doc.documentType}`,
  });

  return (
    <section className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 space-y-1">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {labels.title}
          </h2>
          <p className="text-sm text-muted-foreground">{labels.description}</p>
        </div>
        <Link
          href="/fundador/documentos"
          className="relative z-10 inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-border/70 bg-card/80 px-3 py-2 text-xs font-medium text-foreground shadow-soft transition-all hover:border-primary/30 hover:bg-muted/50 hover:shadow-card"
        >
          {labels.browseAllDocuments}
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
            {labels.allCompleteTitle}
          </p>
          <p className="relative mx-auto mt-1.5 max-w-sm text-sm text-muted-foreground">
            {labels.allCompleteDescription}
          </p>
        </div>
      )}

      {alsoActive.length > 0 ? (
        <div className="space-y-3">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            {labels.alsoInProgress}
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
