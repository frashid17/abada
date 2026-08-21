import { auth } from "@clerk/nextjs/server";
import { getLocale, getTranslations } from "next-intl/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentWorkspace } from "@/components/founder/document-workspace";
import { DocumentFlowBackLink } from "@/components/founder/document-flow-back-link";
import { FounderDocumentationTabs } from "@/components/founder/founder-documentation-tabs";
import { Card, CardContent } from "@/components/ui/card";
import { isFlowDocumentType, getIntakeSchema } from "@/lib/documents/intake";
import { ensureInvestmentReadinessChecklist } from "@/lib/documents/dashboard";
import { buildEditableDocumentBody } from "@/lib/documents/editable-body";
import { getDocumentFlowState } from "@/lib/documents/service";
import { isInvestmentDocumentType } from "@/lib/documents/catalog";
import { getAiAccessStatus } from "@/lib/payments/ai-access";

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

  const locale = (await getLocale()) as "es-CO" | "en-US";
  const [state, aiAccess] = await Promise.all([
    getDocumentFlowState(docId),
    getAiAccessStatus(userId, locale),
  ]);
  if (!state) notFound();

  const initialBody = buildEditableDocumentBody(docId, state.fields, locale);
  if (!initialBody) notFound();

  const learnGuideType =
    docId === "shareholders" || docId === "employment" ? docId : undefined;

  return (
    <AppShell variant="founder">
      <div className="-mx-4 space-y-0 sm:-mx-6">
        <div className="sticky top-14 z-30 space-y-3 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm sm:top-16 sm:px-6">
          <DocumentFlowBackLink />
          {learnGuideType ? (
            <FounderDocumentationTabs activeDocument={learnGuideType} />
          ) : null}
        </div>
        <DocumentWorkspace
          documentType={docId}
          initialFields={state.fields}
          initialBody={initialBody}
          status={state.document.status}
          helpMessage={state.helpMessage}
          reviewSummary={state.reviewSummary}
          aiAccess={aiAccess}
          learnGuideType={learnGuideType}
        />
      </div>
    </AppShell>
  );
}
