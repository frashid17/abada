"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Download, Loader2, Save, Sparkles } from "lucide-react";
import {
  draftAssessmentFromFindingsAction,
  downloadDdReportAction,
  saveAssessmentAction,
} from "@/lib/dd/actions";
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

  function draftFromFindings() {
    setMessage(null);
    startTransition(async () => {
      const result = await draftAssessmentFromFindingsAction(dealId);
      if (result.ok) {
        setSummary(result.draft);
        setMessage(t("assessmentDrafted"));
      }
    });
  }

  function downloadReport() {
    setMessage(null);
    startTransition(async () => {
      const result = await downloadDdReportAction(dealId);
      if (!result.ok) return;
      const blob = new Blob([result.body], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = result.fileName;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(t("reportDownloaded"));
    });
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm">
      <div className="border-b border-border/60 bg-muted/20 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {t("assessmentEyebrow")}
        </p>
        <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight">{t("assessmentTitle")}</h3>
        {publishedAt ? (
          <p className="mt-1 text-xs text-muted-foreground">
            {t("publishedAt", { date: new Date(publishedAt).toLocaleDateString() })}
          </p>
        ) : (
          <p className="mt-1 text-xs text-muted-foreground">{t("assessmentHint")}</p>
        )}
      </div>

      <div className="space-y-4 p-5">
        <div className="space-y-1.5">
          <Label htmlFor="assessment-summary">{t("assessmentSummaryLabel")}</Label>
          <Textarea
            id="assessment-summary"
            value={summary}
            disabled={pending}
            rows={7}
            onChange={(e) => setSummary(e.target.value)}
            className="min-h-[10rem]"
          />
        </div>

        <div className="grid gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="cursor-pointer justify-start"
            onClick={draftFromFindings}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {t("draftFromFindings")}
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="cursor-pointer justify-start"
            onClick={downloadReport}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {t("downloadReport")}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border/50 pt-4">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            className="cursor-pointer"
            onClick={() => save(false)}
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {t("saveDraftAssessment")}
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={pending || !summary.trim()}
            className="cursor-pointer"
            onClick={() => save(true)}
          >
            {t("publishAssessment")}
          </Button>
        </div>

        {message ? <p className="text-sm text-risk-low">{message}</p> : null}
      </div>
    </div>
  );
}
