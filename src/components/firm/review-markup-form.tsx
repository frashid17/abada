"use client";

import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Save } from "lucide-react";
import type { ReviewStatus } from "@/lib/firm/reviews";
import { updateFirmReviewAction } from "@/lib/firm/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type ReviewMarkupFormProps = {
  reviewId: string;
  initialStatus: ReviewStatus;
  initialNotes: string;
  initialExecutiveSummary: string;
  attorneyName?: string | null;
  signedAt?: string | null;
};

export function ReviewMarkupForm({
  reviewId,
  initialStatus,
  initialNotes,
  initialExecutiveSummary,
  attorneyName,
  signedAt,
}: ReviewMarkupFormProps) {
  const t = useTranslations("firm.review");
  const [status, setStatus] = useState<ReviewStatus>(initialStatus);
  const [notes, setNotes] = useState(initialNotes);
  const [executiveSummary, setExecutiveSummary] = useState(initialExecutiveSummary);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    startTransition(async () => {
      const result = await updateFirmReviewAction(reviewId, {
        status,
        notes,
        executiveSummary: executiveSummary.trim() || null,
      });
      setMessage(result.ok ? t("saved") : (result.error ?? t("saveError")));
    });
  }

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="review-status">{t("statusLabel")}</Label>
        <Select
          id="review-status"
          value={status}
          disabled={pending}
          onChange={(e) => setStatus(e.target.value as ReviewStatus)}
        >
          <option value="queued">{t("status.queued")}</option>
          <option value="in_progress">{t("status.in_progress")}</option>
          <option value="completed">{t("status.completed")}</option>
          <option value="cancelled">{t("status.cancelled")}</option>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-notes">{t("notesLabel")}</Label>
        <Textarea
          id="review-notes"
          value={notes}
          disabled={pending}
          placeholder={t("notesPlaceholder")}
          onChange={(e) => setNotes(e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="review-summary">{t("summaryLabel")}</Label>
        <Textarea
          id="review-summary"
          value={executiveSummary}
          disabled={pending}
          placeholder={t("summaryPlaceholder")}
          onChange={(e) => setExecutiveSummary(e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      {status === "completed" ? (
        <p className="text-xs text-muted-foreground">{t("completeNote")}</p>
      ) : null}

      {attorneyName && signedAt ? (
        <p className="text-sm text-muted-foreground">
          {t("attorneySigned", {
            name: attorneyName,
            date: new Date(signedAt).toLocaleDateString(),
          })}
        </p>
      ) : null}

      <Button type="button" size="sm" disabled={pending} onClick={handleSave}>
        <Save className="h-4 w-4" />
        {pending ? t("saving") : t("save")}
      </Button>

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
