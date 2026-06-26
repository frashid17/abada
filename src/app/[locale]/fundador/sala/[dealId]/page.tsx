import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { CategoryCoveragePanel } from "@/components/dd/category-coverage-panel";
import { DataRoomDocumentList } from "@/components/dd/data-room-document-list";
import { DataRoomUploadForm } from "@/components/dd/data-room-upload-form";
import { DealRoomBackLink } from "@/components/dd/deal-room-back-link";
import { DealRoomStats } from "@/components/dd/deal-room-stats";
import { assertDealParticipant } from "@/lib/data-room/access";
import { getDealRoomSummary } from "@/lib/deals/summaries";
import { listDealsForParticipant } from "@/lib/deals/service";
import { listDataRoomDocuments } from "@/lib/data-room/service";

export default async function FounderSalaDealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/sala");

  try {
    await assertDealParticipant(dealId, userId, ["target"]);
  } catch {
    notFound();
  }

  const deals = await listDealsForParticipant(userId, "target");
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) notFound();

  const user = await currentUser();
  const uploaderName =
    user?.fullName ?? user?.primaryEmailAddress?.emailAddress ?? userId.slice(0, 8);

  const t = await getTranslations("founder.sala");
  const [documents, summary] = await Promise.all([
    listDataRoomDocuments(dealId),
    getDealRoomSummary(dealId),
  ]);

  return (
    <AppShell variant="founder">
      <div className="space-y-8">
        <DealRoomBackLink href="/fundador/sala" variant="founder" />
        <PageHeader eyebrow={t("eyebrow")} title={deal.name} description={t("dealSubtitle")} />
        <DealRoomStats summary={summary} variant="founder" />

        <div className="grid gap-8 xl:grid-cols-[1fr_400px]">
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">{t("documentsTitle")}</h2>
              <DataRoomDocumentList documents={documents} showDownload={false} />
            </section>
            <CategoryCoveragePanel documents={documents} />
          </div>

          <DataRoomUploadForm dealId={dealId} uploaderName={uploaderName} />
        </div>
      </div>
    </AppShell>
  );
}
