import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { ParticipantDealList } from "@/components/dd/participant-deal-list";
import { getDealRoomSummaries } from "@/lib/deals/summaries";
import { listDealsForParticipant } from "@/lib/deals/service";
import { Upload } from "lucide-react";

export default async function FounderSalaPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/sala");

  const t = await getTranslations("founder.sala");
  const deals = await listDealsForParticipant(userId, "target");
  const summaries = await getDealRoomSummaries(deals.map((deal) => deal.id));

  return (
    <AppShell variant="founder">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <ParticipantDealList
          deals={deals}
          summaries={summaries}
          basePath="/fundador/sala"
          variant="founder"
        />
        {deals.length > 0 ? (
          <FeaturePanel
            tone="trust"
            icon={Upload}
            eyebrow={t("tipsEyebrow")}
            title={t("tipsTitle")}
            description={t("tipsDescription")}
            className="max-w-3xl"
          />
        ) : null}
      </div>
    </AppShell>
  );
}
