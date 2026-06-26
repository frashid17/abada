import { getFormatter, getTranslations } from "next-intl/server";
import { FileText } from "lucide-react";
import type { AssessmentRecord } from "@/lib/dd/assessments";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type InvestorAssessmentPanelProps = {
  assessment: AssessmentRecord | null;
};

export async function InvestorAssessmentPanel({ assessment }: InvestorAssessmentPanelProps) {
  const t = await getTranslations("investor.room");
  const format = await getFormatter();

  if (!assessment) {
    return (
      <Card variant="elevated">
        <CardContent className="space-y-2 p-6">
          <p className="font-medium text-foreground">{t("assessmentPendingTitle")}</p>
          <p className="text-sm text-muted-foreground">{t("assessmentPendingDescription")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="feature">
      <CardHeader>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-base">{t("assessmentTitle")}</CardTitle>
            <CardDescription>
              {t("assessmentPublishedAt", {
                date: format.dateTime(new Date(assessment.publishedAt!), { dateStyle: "long" }),
              })}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
          {assessment.summary}
        </p>
      </CardContent>
    </Card>
  );
}
