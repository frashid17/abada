import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FounderDiligenceForm } from "@/components/founder/founder-diligence-form";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getOrCreateFounderQuestionnaire } from "@/lib/dd/questionnaire";

export default async function FounderDiligencePage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/diligencia");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const t = await getTranslations("founder.diligence");
  const { questionnaire, answers, questions, deals } =
    await getOrCreateFounderQuestionnaire(userId);

  return (
    <AppShell variant="founder">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        {questions.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("emptyQuestions")}</p>
        ) : (
          <FounderDiligenceForm
            questionnaire={questionnaire}
            questions={questions}
            initialAnswers={answers}
            deals={deals}
          />
        )}
      </div>
    </AppShell>
  );
}
