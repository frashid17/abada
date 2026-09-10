"use client";

import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import { ShieldCheck } from "lucide-react";
import { FounderChecklistTracker } from "@/components/founder/founder-checklist-tracker";
import { FounderDashboardHero } from "@/components/founder/founder-dashboard-hero";
import { FounderWorkspaceFocusClient } from "@/components/founder/founder-workspace-focus-client";
import { PROTOTYPE_DOC_ICONS } from "@/components/founder/document-icons";
import { usePrototypeContent } from "@/components/founder/prototype-content-provider";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";
import {
  getFounderPipelineProgress,
  toDashboardDocumentStatus,
} from "@/lib/documents/founder-pipeline";
import { usePrototypeDocumentStore } from "@/lib/documents/prototype/store";
import { getFirmName } from "@/lib/brand";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import type { FounderDashboardInsights } from "@/lib/documents/dashboard-insights";

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

export function FounderDashboardBody() {
  const t = useTranslations("founder");
  const locale = useLocale();
  const lang = locale.startsWith("en") ? "en" : "es";
  const firmName = getFirmName();
  const content = usePrototypeContent();
  const { store } = usePrototypeDocumentStore();

  const statusLabels = useMemo(
    () =>
      Object.fromEntries(
        (["not_started", "draft", "flagged", "in_review", "complete"] as DocumentStatus[]).map(
          (status) => [status, t(`dashboard.status.${status}`)],
        ),
      ) as Record<DocumentStatus, string>,
    [t],
  );

  const progress = useMemo(
    () => getFounderPipelineProgress(content, store),
    [content, store],
  );

  const documents = useMemo(() => toDashboardDocuments(progress), [progress]);

  const documentTitles = useMemo(
    () =>
      Object.fromEntries(
        content.order.map((id) => {
          const doc = content.docs[id];
          return [id, lang === "en" ? (doc?.t_en ?? id) : (doc?.t_es ?? id)];
        }),
      ),
    [content.docs, content.order, lang],
  );

  const documentDescriptions = useMemo(
    () =>
      Object.fromEntries(
        content.order.map((id) => {
          const doc = content.docs[id];
          return [id, lang === "en" ? (doc?.sub_en ?? "") : (doc?.sub_es ?? "")];
        }),
      ),
    [content.docs, content.order, lang],
  );

  const hrefById = useMemo(
    () => Object.fromEntries(progress.documents.map((doc) => [doc.id, doc.href])),
    [progress.documents],
  );

  const nextDashboardDoc = progress.nextDocument
    ? (documents.find((doc) => doc.id === progress.nextDocument?.id) ?? null)
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

  const stepLabel = (step: number) => t("dashboard.step", { step });

  return (
    <div className="space-y-12">
      <FounderDashboardHero
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        progressLabel={progressLabel}
        completedCount={progress.completedCount}
        totalCount={progress.totalCount}
        insights={insights}
        nextDocument={nextDashboardDoc}
        nextDocumentTitle={nextDocumentTitle}
        continueCta={t("dashboard.continueCta")}
        stats={{
          completed: t("dashboard.stats.completed"),
          inProgress: t("dashboard.stats.inProgress"),
          needsAttention: t("dashboard.stats.needsAttention"),
          remaining: t("dashboard.stats.remaining"),
        }}
        nextDocumentHref={progress.nextDocument?.href ?? "/fundador/documentos"}
      />

      <FounderChecklistTracker
        documents={documents}
        labels={statusLabels}
        documentTitles={documentTitles}
        stepLabel={stepLabel}
        title={t("dashboard.pipelineTitle")}
        subtitle={t("dashboard.pipelineSubtitle")}
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
          statusLabels={statusLabels}
          labels={{
            title: t("dashboard.focusTitle"),
            description: t("dashboard.focusDescription"),
            browseAllDocuments: t("dashboard.browseAllDocuments"),
            alsoInProgress: t("dashboard.alsoInProgress"),
            allCompleteTitle: t("dashboard.allCompleteTitle"),
            allCompleteDescription: t("dashboard.allCompleteDescription"),
            startDocument: t("dashboard.startDocument"),
            viewDocument: t("dashboard.viewDocument"),
            stepLabel,
          }}
        />

        <aside className="space-y-4 xl:sticky xl:top-24">
          <FeaturePanel
            tone="trust"
            icon={ShieldCheck}
            eyebrow={firmName}
            title={t("dashboard.reviewTitle")}
            description={t("dashboard.reviewDescription")}
            className="rounded-3xl p-6"
          />
          <LegalDisclosure message={t("dashboard.disclaimer")} className="text-xs" />
        </aside>
      </div>
    </div>
  );
}
