"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Plus } from "lucide-react";
import { createFindingAction } from "@/lib/dd/actions";
import { DD_RISK_CATEGORIES, DD_RISK_LEVELS } from "@/lib/dd/taxonomy";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type PlaybookTip = {
  areaId: string;
  title: string;
  checks: string[];
  riskCategory: string;
};

type FindingFormProps = {
  dealId: string;
  documentOptions: Array<{ id: string; label: string }>;
  playbookTips: PlaybookTip[];
};

export function FindingForm({ dealId, documentOptions, playbookTips }: FindingFormProps) {
  const t = useTranslations("firm.dd");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [riskCategory, setRiskCategory] = useState<string>(DD_RISK_CATEGORIES[0]!);
  const [playbookAreaId, setPlaybookAreaId] = useState<string>(playbookTips[0]?.areaId ?? "");

  const tipsForRisk = useMemo(
    () => playbookTips.filter((tip) => tip.riskCategory === riskCategory),
    [playbookTips, riskCategory],
  );

  const activeTip =
    tipsForRisk.find((tip) => tip.areaId === playbookAreaId) ?? tipsForRisk[0] ?? null;

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
    <form
      onSubmit={handleSubmit}
      className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-sm"
    >
      <div className="border-b border-border/60 bg-muted/20 px-5 py-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          {t("reviewPanelEyebrow")}
        </p>
        <h3 className="mt-1 font-serif text-lg font-semibold tracking-tight">{t("addFinding")}</h3>
        <p className="mt-1 text-xs text-muted-foreground">{t("addFindingHint")}</p>
      </div>

      <div className="space-y-4 p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="riskCategory">{t("riskCategoryLabel")}</Label>
            <Select
              id="riskCategory"
              name="riskCategory"
              required
              disabled={pending}
              value={riskCategory}
              onChange={(e) => {
                setRiskCategory(e.target.value);
                const nextTips = playbookTips.filter((tip) => tip.riskCategory === e.target.value);
                setPlaybookAreaId(nextTips[0]?.areaId ?? "");
              }}
            >
              {DD_RISK_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {t(`riskCategories.${category}`)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1.5">
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

        {tipsForRisk.length > 0 ? (
          <div className="space-y-2 rounded-xl border border-primary/20 bg-primary/5 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="playbookArea" className="text-primary">
                {t("playbookAssistTitle")}
              </Label>
            </div>
            {tipsForRisk.length > 1 ? (
              <Select
                id="playbookArea"
                value={activeTip?.areaId ?? ""}
                onChange={(e) => setPlaybookAreaId(e.target.value)}
                disabled={pending}
              >
                {tipsForRisk.map((tip) => (
                  <option key={tip.areaId} value={tip.areaId}>
                    {tip.title}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="text-sm font-medium text-foreground">{activeTip?.title}</p>
            )}
            <ul className="space-y-1.5 pt-1">
              {(activeTip?.checks ?? []).map((check) => (
                <li key={check} className="flex gap-2 text-xs leading-relaxed text-muted-foreground">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                  <span>{check}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-1.5">
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

        <div className="space-y-1.5">
          <Label htmlFor="description">{t("findingDescriptionLabel")}</Label>
          <Textarea id="description" name="description" required disabled={pending} rows={3} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="recommendedAction">{t("recommendedActionLabel")}</Label>
          <Textarea id="recommendedAction" name="recommendedAction" disabled={pending} rows={2} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="legalCitation">{t("legalCitationLabel")}</Label>
          <input
            id="legalCitation"
            name="legalCitation"
            disabled={pending}
            className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm disabled:opacity-50"
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full cursor-pointer">
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {t("saveFinding")}
        </Button>

        {message ? <p className="text-center text-sm text-risk-low">{message}</p> : null}
      </div>
    </form>
  );
}
