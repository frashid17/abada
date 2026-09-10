import { getTranslations } from "next-intl/server";
import { FounderDashboardBody } from "@/components/founder/founder-dashboard-body";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";
import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { ShieldCheck } from "lucide-react";
import { getFirmName } from "@/lib/brand";
import { getResolvedPrototypeContent } from "@/lib/documents/prototype/resolve-content";
import type { DocumentStatus } from "@/lib/documents/catalog";

export async function FounderDashboard() {
  const t = await getTranslations("founder");
  const firmName = getFirmName();
  const content = await getResolvedPrototypeContent();

  const statusLabels = Object.fromEntries(
    (["not_started", "draft", "flagged", "in_review", "complete"] as DocumentStatus[]).map(
      (status) => [status, t(`dashboard.status.${status}`)],
    ),
  ) as Record<DocumentStatus, string>;

  const sidebar = (
    <>
      <FeaturePanel
        tone="trust"
        icon={ShieldCheck}
        eyebrow={firmName}
        title={t("dashboard.reviewTitle")}
        description={t("dashboard.reviewDescription")}
        className="rounded-3xl p-6"
      />
      <LegalDisclosure message={t("dashboard.disclaimer")} className="text-xs" />
    </>
  );

  return (
    <PrototypeContentProvider content={content}>
      <FounderDashboardBody
        sidebar={sidebar}
        hero={{
          eyebrow: t("dashboard.eyebrow"),
          title: t("dashboard.title"),
          subtitle: t("dashboard.subtitle"),
          continueCta: t("dashboard.continueCta"),
          stats: {
            completed: t("dashboard.stats.completed"),
            inProgress: t("dashboard.stats.inProgress"),
            needsAttention: t("dashboard.stats.needsAttention"),
            remaining: t("dashboard.stats.remaining"),
          },
        }}
        pipeline={{
          title: t("dashboard.pipelineTitle"),
          subtitle: t("dashboard.pipelineSubtitle"),
          stepLabel: (step) => t("dashboard.step", { step }),
        }}
        focus={{
          title: t("dashboard.focusTitle"),
          description: t("dashboard.focusDescription"),
          browseAllDocuments: t("dashboard.browseAllDocuments"),
          alsoInProgress: t("dashboard.alsoInProgress"),
          allCompleteTitle: t("dashboard.allCompleteTitle"),
          allCompleteDescription: t("dashboard.allCompleteDescription"),
          startDocument: t("dashboard.startDocument"),
          viewDocument: t("dashboard.viewDocument"),
          statusLabels,
          stepLabel: (step) => t("dashboard.step", { step }),
        }}
      />
    </PrototypeContentProvider>
  );
}
