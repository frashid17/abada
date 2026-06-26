"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus } from "lucide-react";
import { createFindingAction } from "@/lib/dd/actions";
import { DD_RISK_CATEGORIES, DD_RISK_LEVELS } from "@/lib/dd/taxonomy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type FindingFormProps = {
  dealId: string;
  documentOptions: Array<{ id: string; label: string }>;
};

export function FindingForm({ dealId, documentOptions }: FindingFormProps) {
  const t = useTranslations("firm.dd");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFindingAction({
        dealId,
        riskCategory: String(form.get("riskCategory")),
        riskLevel: String(form.get("riskLevel")),
        description: String(form.get("description")),
        sourceDocumentId: String(form.get("sourceDocumentId") || "") || undefined,
        recommendedAction: String(form.get("recommendedAction") || "") || undefined,
        legalCitation: String(form.get("legalCitation") || "") || undefined,
      });

      if (result.ok) {
        setMessage(t("findingSaved"));
        e.currentTarget.reset();
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-card p-5">
      <h3 className="font-serif text-lg font-semibold">{t("addFinding")}</h3>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="riskCategory">{t("riskCategoryLabel")}</Label>
          <Select id="riskCategory" name="riskCategory" required disabled={pending}>
            {DD_RISK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {t(`riskCategories.${category}`)}
              </option>
            ))}
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="riskLevel">{t("riskLevelLabel")}</Label>
          <Select id="riskLevel" name="riskLevel" required disabled={pending}>
            {DD_RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`riskLevels.${level}`)}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="sourceDocumentId">{t("sourceDocumentLabel")}</Label>
        <Select id="sourceDocumentId" name="sourceDocumentId" disabled={pending}>
          <option value="">{t("noSourceDocument")}</option>
          {documentOptions.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("findingDescriptionLabel")}</Label>
        <Textarea id="description" name="description" required disabled={pending} rows={3} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="recommendedAction">{t("recommendedActionLabel")}</Label>
        <Textarea id="recommendedAction" name="recommendedAction" disabled={pending} rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="legalCitation">{t("legalCitationLabel")}</Label>
        <InputLike id="legalCitation" name="legalCitation" disabled={pending} />
      </div>

      <Button type="submit" disabled={pending} size="sm">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {t("saveFinding")}
      </Button>

      {message ? <p className="text-sm text-risk-low">{message}</p> : null}
    </form>
  );
}

function InputLike(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
    />
  );
}
