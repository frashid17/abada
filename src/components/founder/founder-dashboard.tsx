import { getTranslations } from "next-intl/server";
import { FounderChecklistTracker } from "@/components/founder/founder-checklist-tracker";
import { FounderDashboardHero } from "@/components/founder/founder-dashboard-hero";
import { FounderWorkspaceFocus } from "@/components/founder/founder-workspace-focus";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";
import { ShieldCheck } from "lucide-react";
import { getFounderDashboardInsights } from "@/lib/documents/dashboard-insights";
import type { FounderDashboardData } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import { getFirmName } from "@/lib/brand";

type FounderDashboardProps = {
  data: FounderDashboardData;
};

export async function FounderDashboard({ data }: FounderDashboardProps) {
  const t = await getTranslations("founder");
  const firmName = getFirmName();
  const insights = getFounderDashboardInsights(data);
  const pipelineDocuments = [...data.documents].sort((a, b) => a.step - b.step);

  const statusLabels = Object.fromEntries(
    (["not_started", "draft", "flagged", "in_review", "complete"] as DocumentStatus[]).map(
      (status) => [status, t(`dashboard.status.${status}`)],
    ),
  ) as Record<DocumentStatus, string>;

  const nextTitle = insights.nextDocument
    ? t(`documents.${insights.nextDocument.documentType}.title`)
    : null;

  return (
    <div className="space-y-10">
      <FounderDashboardHero
        eyebrow={t("dashboard.eyebrow")}
        title={t("dashboard.title")}
        subtitle={t("dashboard.subtitle")}
        progressLabel={t("dashboard.progress", {
          completed: data.completedCount,
          total: data.totalCount,
        })}
        completedCount={data.completedCount}
        totalCount={data.totalCount}
        insights={insights}
        nextDocument={insights.nextDocument}
        nextDocumentTitle={nextTitle ? t("dashboard.nextUp", { title: nextTitle }) : null}
        continueCta={t("dashboard.continueCta")}
        stats={{
          completed: t("dashboard.stats.completed"),
          inProgress: t("dashboard.stats.inProgress"),
          needsAttention: t("dashboard.stats.needsAttention"),
          remaining: t("dashboard.stats.remaining"),
        }}
      />

      <FounderChecklistTracker
        documents={pipelineDocuments}
        labels={statusLabels}
        stepLabel={(step) => t("dashboard.step", { step })}
        title={t("dashboard.pipelineTitle")}
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_280px] xl:items-start">
        <FounderWorkspaceFocus data={data} />

        <aside className="space-y-3">
          <FeaturePanel
            tone="trust"
            icon={ShieldCheck}
            eyebrow={firmName}
            title={t("dashboard.reviewTitle")}
            description={t("dashboard.reviewDescription")}
            className="p-5"
          />
          <LegalDisclosure message={t("dashboard.disclaimer")} className="text-xs" />
        </aside>
      </div>
    </div>
  );
}
