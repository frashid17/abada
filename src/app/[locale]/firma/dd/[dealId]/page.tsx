import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { DataRoomDocumentList } from "@/components/dd/data-room-document-list";
import { FindingsRegister } from "@/components/dd/findings-register";
import { FirmDealWorkspace } from "@/components/dd/firm-deal-workspace";
import { FirmReviewPanel } from "@/components/dd/firm-review-panel";
import { AddInvestorForm } from "@/components/firm/add-investor-form";
import { DealParticipantsPanel } from "@/components/firm/deal-participants-panel";
import { FirmScheduledCallsPanel } from "@/components/firm/firm-scheduled-calls-panel";
import { DeleteDealButton } from "@/components/firm/delete-deal-button";
import { Button } from "@/components/ui/button";
import { getDealAssessment } from "@/lib/dd/assessments";
import { buildDdAiSessionContext } from "@/lib/dd/ai-session-context";
import { listDealFindings, listFindingsByCategory } from "@/lib/dd/findings";
import { listPlaybookAreas, getPlaybookArea } from "@/lib/dd/playbook";
import { listDataRoomDocuments } from "@/lib/data-room/service";
import { listDealParticipantsWithLabels } from "@/lib/deals/participants";
import { getFirmDeal } from "@/lib/firm/deals";
import { requireFirmPageAccess } from "@/lib/firm/session";
import { listScheduledCallsForTenant } from "@/lib/scheduled-calls/service";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { getAiAccessStatus } from "@/lib/payments/ai-access";

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
  const locale = await getLocale();
  const playbookLocale = locale.startsWith("en") ? "en" : "es";
  const { userId } = await auth();
  const membership = userId ? await getFirmMembershipForUser(userId) : null;
  const documentLocale = locale.startsWith("en") ? "en-US" : "es-CO";
  const [documents, findingsByCategory, findings, assessment, participants, scheduledCalls, aiAccess] =
    await Promise.all([
      listDataRoomDocuments(dealId),
      listFindingsByCategory(dealId),
      listDealFindings(dealId),
      getDealAssessment(dealId),
      listDealParticipantsWithLabels(dealId),
      membership ? listScheduledCallsForTenant(membership.tenantId) : Promise.resolve([]),
      userId
        ? getAiAccessStatus(userId, documentLocale)
        : Promise.resolve({
            hasAccess: false,
            paywallEnabled: true,
            amountFormatted: "",
          }),
    ]);

  const documentOptions = documents.map((doc) => ({
    id: doc.id,
    label: `${doc.title} (v${doc.versionNumber})`,
  }));

  const playbookTips = listPlaybookAreas()
    .map((areaId) => {
      const area = getPlaybookArea(areaId);
      if (!area) return null;
      return {
        areaId,
        title: area.title[playbookLocale],
        checks: [...area.checks[playbookLocale]],
        riskCategory: area.riskCategory,
      };
    })
    .filter((tip): tip is NonNullable<typeof tip> => tip !== null);

  const assessmentStatus = assessment?.publishedAt
    ? t("stats.published")
    : assessment?.summary
      ? t("stats.draft")
      : t("stats.pending");

  const aiSessionContext = buildDdAiSessionContext({
    dealName: deal.name,
    dealStatus: deal.status,
    documents: documents.map((doc) => ({
      title: doc.title,
      category: doc.taxonomyCategory,
      versionNumber: doc.versionNumber,
    })),
    findings: findings.map((finding) => ({
      riskCategory: finding.riskCategory,
      riskLevel: finding.riskLevel,
      description: finding.description,
      recommendedAction: finding.recommendedAction,
    })),
    assessmentSummary: assessment?.summary ?? null,
    assessmentPublished: Boolean(assessment?.publishedAt),
  });

  return (
    <AppShell variant="firm" workspace>
      <div className="flex min-h-0 flex-1 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <Button asChild variant="ghost" size="sm" className="-ml-2 text-muted-foreground">
            <Link href="/firma/dd">
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">{t("backToRooms")}</span>
              <span className="sm:hidden">{t("backShort")}</span>
            </Link>
          </Button>
          <DeleteDealButton dealId={dealId} dealName={deal.name} />
        </div>

        <header className="shrink-0 rounded-xl border border-border/70 bg-card px-3 py-2.5 sm:px-5 sm:py-3">
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <div className="min-w-0 space-y-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {t("eyebrow")}
              </p>
              <h1 className="truncate font-serif text-lg font-semibold tracking-tight sm:text-xl">
                {deal.name}
              </h1>
            </div>
            <dl className="grid grid-cols-4 divide-x divide-border/60 overflow-hidden rounded-lg border border-border/60 bg-background/50">
              <StatChip label={t("stats.documents")} value={String(documents.length)} />
              <StatChip label={t("stats.findings")} value={String(findings.length)} />
              <StatChip label={t("stats.assessment")} value={assessmentStatus} />
              <StatChip label={t("stats.status")} value={deal.status} />
            </dl>
          </div>
        </header>

        <FirmDealWorkspace
          room={
            <>
              <section className="space-y-3">
                <SectionHeading title={t("documentsTitle")} hint={t("documentsHint")} />
                <DataRoomDocumentList documents={documents} />
              </section>

              <section className="space-y-3">
                <SectionHeading title={t("findingsTitle")} hint={t("findingsHint")} />
                <FindingsRegister findingsByCategory={findingsByCategory} />
              </section>

              <section className="grid gap-4 pb-2 lg:grid-cols-2">
                <DealParticipantsPanel participants={participants} />
                <div className="space-y-4">
                  <AddInvestorForm dealId={dealId} />
                  <FirmScheduledCallsPanel calls={scheduledCalls} />
                </div>
              </section>
            </>
          }
          review={
            <FirmReviewPanel
              dealId={dealId}
              dealName={deal.name}
              documentOptions={documentOptions}
              playbookTips={playbookTips}
              initialSummary={assessment?.summary ?? ""}
              publishedAt={assessment?.publishedAt ?? null}
              aiSessionContext={aiSessionContext}
              aiAccess={aiAccess}
            />
          }
        />
      </div>
    </AppShell>
  );
}

function SectionHeading({ title, hint }: { title: string; hint: string }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-2">
      <h2 className="font-serif text-lg font-semibold tracking-tight sm:text-xl">{title}</h2>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 px-1.5 py-1.5 text-center sm:px-3 sm:py-2 sm:text-left">
      <dt className="truncate text-[9px] uppercase tracking-wide text-muted-foreground sm:text-[10px]">
        {label}
      </dt>
      <dd className="truncate text-xs font-semibold capitalize text-foreground sm:text-sm">{value}</dd>
    </div>
  );
}
