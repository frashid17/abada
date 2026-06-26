import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AssessmentForm } from "@/components/dd/assessment-form";
import { DataRoomDocumentList } from "@/components/dd/data-room-document-list";
import { FindingForm } from "@/components/dd/finding-form";
import { FindingsByCategory } from "@/components/dd/findings-by-category";
import { getDealAssessment } from "@/lib/dd/assessments";
import { listFindingsByCategory } from "@/lib/dd/findings";
import { listDataRoomDocuments } from "@/lib/data-room/service";
import { getFirmDeal } from "@/lib/firm/deals";
import { requireFirmPageAccess } from "@/lib/firm/session";
import { DeleteDealButton } from "@/components/firm/delete-deal-button";

export default async function FirmDealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  await requireFirmPageAccess(`/firma/dd/${dealId}`);

  const deal = await getFirmDeal(dealId);
  if (!deal) notFound();

  const t = await getTranslations("firm.dd");
  const [documents, findingsByCategory, assessment] = await Promise.all([
    listDataRoomDocuments(dealId),
    listFindingsByCategory(dealId),
    getDealAssessment(dealId),
  ]);

  const documentOptions = documents.map((doc) => ({
    id: doc.id,
    label: `${doc.title} (v${doc.versionNumber})`,
  }));

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={deal.name}
          description={t("dealSubtitle")}
          action={<DeleteDealButton dealId={dealId} dealName={deal.name} />}
        />

        <div className="grid gap-8 xl:grid-cols-[1fr_360px]">
          <div className="space-y-8">
            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">{t("documentsTitle")}</h2>
              <DataRoomDocumentList documents={documents} />
            </section>

            <section className="space-y-4">
              <h2 className="font-serif text-xl font-semibold">{t("findingsTitle")}</h2>
              <FindingsByCategory findingsByCategory={findingsByCategory} />
            </section>
          </div>

          <aside className="space-y-6">
            <FindingForm dealId={dealId} documentOptions={documentOptions} />
            <AssessmentForm
              dealId={dealId}
              initialSummary={assessment?.summary ?? ""}
              publishedAt={assessment?.publishedAt ?? null}
            />
          </aside>
        </div>
      </div>
    </AppShell>
  );
}
