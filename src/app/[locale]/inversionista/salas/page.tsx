import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ParticipantDealList } from "@/components/dd/participant-deal-list";
import { getDealRoomSummaries } from "@/lib/deals/summaries";
import { listDealsForParticipant } from "@/lib/deals/service";

export default async function InvestorRoomsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/inversionista/salas");

  const t = await getTranslations("investor.room");
  const deals = await listDealsForParticipant(userId, "investor");
  const summaries = await getDealRoomSummaries(deals.map((deal) => deal.id));

  return (
    <AppShell variant="investor">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <ParticipantDealList
          deals={deals}
          summaries={summaries}
          basePath="/inversionista/salas"
          variant="investor"
        />
      </div>
    </AppShell>
  );
}
