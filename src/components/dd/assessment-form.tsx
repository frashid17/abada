"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { saveAssessmentAction } from "@/lib/dd/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type AssessmentFormProps = {
  dealId: string;
  initialSummary: string;
  publishedAt: string | null;
};

export function AssessmentForm({ dealId, initialSummary, publishedAt }: AssessmentFormProps) {
  const t = useTranslations("firm.dd");
  const [summary, setSummary] = useState(initialSummary);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function save(publish: boolean) {
    setMessage(null);
    startTransition(async () => {
      const result = await saveAssessmentAction({ dealId, summary, publish });
      if (result.ok) setMessage(publish ? t("assessmentPublished") : t("assessmentSaved"));
    });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold">{t("assessmentTitle")}</h3>
        {publishedAt ? (
          <p className="text-xs text-muted-foreground">
            {t("publishedAt", { date: new Date(publishedAt).toLocaleDateString() })}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="assessment-summary">{t("assessmentSummaryLabel")}</Label>
        <Textarea
          id="assessment-summary"
          value={summary}
          disabled={pending}
          rows={6}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => save(false)}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {t("saveDraftAssessment")}
        </Button>
        <Button type="button" size="sm" disabled={pending || !summary.trim()} onClick={() => save(true)}>
          {t("publishAssessment")}
        </Button>
      </div>

      {message ? <p className="text-sm text-risk-low">{message}</p> : null}
    </div>
  );
}
