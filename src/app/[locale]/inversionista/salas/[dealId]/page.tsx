import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SplitWorkspace } from "@/components/layout/split-workspace";
import { DataRoomDocumentList } from "@/components/dd/data-room-document-list";
import { DealRoomBackLink } from "@/components/dd/deal-room-back-link";
import { DealRoomStats } from "@/components/dd/deal-room-stats";
import { FindingsByCategory } from "@/components/dd/findings-by-category";
import { InvestorAssessmentPanel } from "@/components/dd/investor-assessment-panel";
import { ScheduleCallForm } from "@/components/dd/schedule-call-form";
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
    <AppShell variant="investor" workspace>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <DealRoomBackLink href="/inversionista/salas" variant="investor" />
          <h1 className="truncate font-serif text-lg font-semibold sm:text-xl">{deal.name}</h1>
        </div>
        <div className="shrink-0">
          <DealRoomStats summary={summary} variant="investor" />
        </div>

        <SplitWorkspace
          panesLabel={t("workspacePanes")}
          primaryLabel={t("paneMain")}
          secondaryLabel={t("paneDocs")}
          primary={
            <>
              <InvestorAssessmentPanel assessment={assessment} />
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-semibold sm:text-xl">{t("findingsTitle")}</h2>
                <FindingsByCategory
                  findingsByCategory={findingsByCategory}
                  translationNamespace="investor.room"
                />
              </section>
            </>
          }
          secondary={
            <section className="space-y-4">
              <h2 className="font-serif text-lg font-semibold sm:text-xl">{t("documentsTitle")}</h2>
              <DataRoomDocumentList documents={documents} showDownload />
              <ScheduleCallForm dealId={dealId} />
            </section>
          }
        />
      </div>
    </AppShell>
  );
}
