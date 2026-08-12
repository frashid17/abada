import { auth, currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { SplitWorkspace } from "@/components/layout/split-workspace";
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
    <AppShell variant="founder" workspace>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <DealRoomBackLink href="/fundador/sala" variant="founder" />
          <h1 className="truncate font-serif text-lg font-semibold sm:text-xl">{deal.name}</h1>
        </div>
        <div className="shrink-0">
          <DealRoomStats summary={summary} variant="founder" />
        </div>

        <SplitWorkspace
          panesLabel={t("workspacePanes")}
          primaryLabel={t("paneRoom")}
          secondaryLabel={t("paneUpload")}
          primary={
            <>
              <section className="space-y-3">
                <h2 className="font-serif text-lg font-semibold sm:text-xl">{t("documentsTitle")}</h2>
                <DataRoomDocumentList documents={documents} showDownload={false} />
              </section>
              <CategoryCoveragePanel documents={documents} />
            </>
          }
          secondary={<DataRoomUploadForm dealId={dealId} uploaderName={uploaderName} />}
        />
      </div>
    </AppShell>
  );
}
