import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentFlow } from "@/components/founder/document-flow";
import { DocumentFlowBackLink } from "@/components/founder/document-flow-back-link";
import { Card, CardContent } from "@/components/ui/card";
import { isFlowDocumentType, getIntakeSchema } from "@/lib/documents/intake";
import { ensureInvestmentReadinessChecklist } from "@/lib/documents/dashboard";
import { getDocumentFlowState } from "@/lib/documents/service";
import { isInvestmentDocumentType } from "@/lib/documents/catalog";

export default async function FounderDocumentFlowPage({
  params,
}: {
  params: Promise<{ docId: string }>;
}) {
  const { docId } = await params;
  if (!isInvestmentDocumentType(docId)) notFound();

  const { userId } = await auth();
  if (!userId) redirect(`/iniciar-sesion?redirect_url=/fundador/documentos/${docId}`);

  await ensureInvestmentReadinessChecklist();

  const t = await getTranslations("founder");

  if (!isFlowDocumentType(docId) || !getIntakeSchema(docId)) {
    return (
      <AppShell variant="founder">
        <div className="space-y-8">
          <DocumentFlowBackLink />
          <PageHeader
            eyebrow={t("documentsPage.title")}
            title={t(`documents.${docId}.title`)}
            description={t(`documents.${docId}.description`)}
          />
          <Card variant="feature" className="max-w-2xl">
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("documentsPage.comingSoon")}
              </p>
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const state = await getDocumentFlowState(docId);
  if (!state) notFound();

  return (
    <AppShell variant="founder">
      <div className="space-y-8">
        <DocumentFlowBackLink />
        <PageHeader
          eyebrow={t("documentsPage.title")}
          title={t(`documents.${docId}.title`)}
          description={t(`documents.${docId}.description`)}
        />
        <DocumentFlow
          documentType={docId}
          initialFields={state.fields}
          status={state.document.status}
          helpMessage={state.helpMessage}
          reviewSummary={state.reviewSummary}
        />
      </div>
    </AppShell>
  );
}
