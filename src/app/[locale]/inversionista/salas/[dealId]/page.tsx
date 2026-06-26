import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DataRoomDocumentList } from "@/components/dd/data-room-document-list";
import { DealRoomBackLink } from "@/components/dd/deal-room-back-link";
import { DealRoomStats } from "@/components/dd/deal-room-stats";
import { FindingsByCategory } from "@/components/dd/findings-by-category";
import { InvestorAssessmentPanel } from "@/components/dd/investor-assessment-panel";
import { getPublishedDealAssessment } from "@/lib/dd/assessments";
import { listFindingsByCategory } from "@/lib/dd/findings";
import { assertDealParticipant } from "@/lib/data-room/access";
import { getDealRoomSummary } from "@/lib/deals/summaries";
import { listDealsForParticipant } from "@/lib/deals/service";
import { listDataRoomDocuments } from "@/lib/data-room/service";

export default async function InvestorRoomDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/inversionista/salas");

  try {
    await assertDealParticipant(dealId, userId, ["investor"]);
  } catch {
    notFound();
  }

  const deals = await listDealsForParticipant(userId, "investor");
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) notFound();

  const t = await getTranslations("investor.room");
  const [documents, summary, findingsByCategory, assessment] = await Promise.all([
    listDataRoomDocuments(dealId),
    getDealRoomSummary(dealId),
    listFindingsByCategory(dealId),
    getPublishedDealAssessment(dealId),
  ]);

  return (
    <AppShell variant="investor">
      <div className="space-y-8">
        <DealRoomBackLink href="/inversionista/salas" variant="investor" />
        <PageHeader eyebrow={t("eyebrow")} title={deal.name} description={t("dealSubtitle")} />
        <DealRoomStats summary={summary} variant="investor" />

        <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <InvestorAssessmentPanel assessment={assessment} />

            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">{t("findingsTitle")}</h2>
              <FindingsByCategory
                findingsByCategory={findingsByCategory}
                translationNamespace="investor.room"
              />
            </section>
          </div>

          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">{t("documentsTitle")}</h2>
            <DataRoomDocumentList documents={documents} showDownload />
          </section>
        </div>
      </div>
    </AppShell>
  );
}
