"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo, type ReactNode } from "react";
import { FounderChecklistTracker } from "@/components/founder/founder-checklist-tracker";
import { FounderDashboardHero } from "@/components/founder/founder-dashboard-hero";
import { FounderWorkspaceFocusClient } from "@/components/founder/founder-workspace-focus-client";
import { PROTOTYPE_DOC_ICONS } from "@/components/founder/document-icons";
import { usePrototypeContent } from "@/components/founder/prototype-content-provider";
import {
  getFounderPipelineProgress,
  toDashboardDocumentStatus,
} from "@/lib/documents/founder-pipeline";
import { usePrototypeDocumentStore } from "@/lib/documents/prototype/store";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import type { FounderDashboardInsights } from "@/lib/documents/dashboard-insights";

type FounderDashboardBodyProps = {
  sidebar: ReactNode;
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    continueCta: string;
    stats: {
      completed: string;
      inProgress: string;
      needsAttention: string;
      remaining: string;
    };
  };
  pipeline: {
    title: string;
    subtitle: string;
    stepLabel: (step: number) => string;
  };
  focus: {
    title: string;
    description: string;
    browseAllDocuments: string;
    alsoInProgress: string;
    allCompleteTitle: string;
    allCompleteDescription: string;
    startDocument: string;
    viewDocument: string;
    statusLabels: Record<DocumentStatus, string>;
    stepLabel: (step: number) => string;
  };
};

function toDashboardDocuments(
  progress: ReturnType<typeof getFounderPipelineProgress>,
): DashboardDocument[] {
  return progress.documents.map((doc) => ({
    id: doc.id,
    documentType: doc.id as DashboardDocument["documentType"],
    title: doc.id,
    status: toDashboardDocumentStatus(doc.status),
    step: doc.step,
    updatedAt: new Date(0).toISOString(),
  }));
}

export function FounderDashboardBody({ sidebar, hero, pipeline, focus }: FounderDashboardBodyProps) {
  const t = useTranslations("founder");
  const locale = useLocale();
  const lang = locale.startsWith("en") ? "en" : "es";
  const content = usePrototypeContent();
  const { store } = usePrototypeDocumentStore();

  const progress = useMemo(
    () => getFounderPipelineProgress(content, store),
    [content, store],
  );

  const documents = useMemo(() => toDashboardDocuments(progress), [progress]);

  const documentTitles = useMemo(
    () =>
      Object.fromEntries(
        content.order.map((id) => [
          id,
          lang === "en" ? content.docs[id].t_en : content.docs[id].t_es,
        ]),
      ),
    [content.docs, content.order, lang],
  );

  const documentDescriptions = useMemo(
    () =>
      Object.fromEntries(
        content.order.map((id) => [
          id,
          lang === "en" ? content.docs[id].sub_en : content.docs[id].sub_es,
        ]),
      ),
    [content.docs, content.order, lang],
  );

  const hrefById = useMemo(
    () => Object.fromEntries(progress.documents.map((doc) => [doc.id, doc.href])),
    [progress.documents],
  );

  const nextDashboardDoc = progress.nextDocument
    ? documents.find((doc) => doc.id === progress.nextDocument?.id) ?? null
    : null;

  const nextDocumentTitle = progress.nextDocument
    ? t("dashboard.nextUp", { title: documentTitles[progress.nextDocument.id] ?? "" })
    : null;

  const insights: FounderDashboardInsights = {
    nextDocument: nextDashboardDoc,
    inProgressCount: progress.inProgressCount,
    needsAttentionCount: 0,
    remainingCount: progress.remainingCount,
    completionPct:
      progress.totalCount > 0
        ? Math.round((progress.completedCount / progress.totalCount) * 100)
        : 0,
  };

  const progressLabel = t("dashboard.progress", {
    completed: progress.completedCount,
    total: progress.totalCount,
  });

  return (
    <div className="space-y-12">
      <FounderDashboardHero
        eyebrow={hero.eyebrow}
        title={hero.title}
        subtitle={hero.subtitle}
        progressLabel={progressLabel}
        completedCount={progress.completedCount}
        totalCount={progress.totalCount}
        insights={insights}
        nextDocument={nextDashboardDoc}
        nextDocumentTitle={nextDocumentTitle}
        continueCta={hero.continueCta}
        stats={hero.stats}
        nextDocumentHref={progress.nextDocument?.href ?? "/fundador/documentos"}
      />

      <FounderChecklistTracker
        documents={documents}
        labels={focus.statusLabels}
        documentTitles={documentTitles}
        stepLabel={pipeline.stepLabel}
        title={pipeline.title}
        subtitle={pipeline.subtitle}
        hrefFor={(id) => hrefById[id] ?? `/fundador/documentos/preparacion/${id}`}
        icons={PROTOTYPE_DOC_ICONS}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_300px] xl:items-start">
        <FounderWorkspaceFocusClient
          documents={documents}
          documentTitles={documentTitles}
          documentDescriptions={documentDescriptions}
          hrefById={hrefById}
          insights={insights}
          statusLabels={focus.statusLabels}
          labels={focus}
        />

        <aside className="space-y-4 xl:sticky xl:top-24">{sidebar}</aside>
      </div>
    </div>
  );
}
