"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ChevronDown,
  Download,
  Loader2,
  Plus,
  Save,
  Sparkles,
} from "lucide-react";
import {
  createFindingAction,
  draftAssessmentFromFindingsAction,
  downloadDdReportAction,
  saveAssessmentAction,
} from "@/lib/dd/actions";
import { DD_RISK_CATEGORIES, DD_RISK_LEVELS } from "@/lib/dd/taxonomy";
import type { PlaybookTip } from "@/components/dd/finding-form";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FirmReviewPanelProps = {
  dealId: string;
  documentOptions: Array<{ id: string; label: string }>;
  playbookTips: PlaybookTip[];
  initialSummary: string;
  publishedAt: string | null;
};

type TabId = "finding" | "assessment";

export function FirmReviewPanel({
  dealId,
  documentOptions,
  playbookTips,
  initialSummary,
  publishedAt,
}: FirmReviewPanelProps) {
  const t = useTranslations("firm.dd");
  const [tab, setTab] = useState<TabId>("finding");

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="border-b border-border/60 px-4 pt-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          {t("reviewPanelEyebrow")}
        </p>
        <div
          role="tablist"
          aria-label={t("reviewPanelEyebrow")}
          className="mt-3 flex gap-1"
        >
          {(
            [
              { id: "finding" as const, label: t("tabFinding") },
              { id: "assessment" as const, label: t("tabAssessment") },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={tab === item.id}
              className={cn(
                "cursor-pointer rounded-t-lg px-3.5 py-2 text-sm font-medium transition-colors",
                tab === item.id
                  ? "border-b-2 border-primary text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => setTab(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4">
        {tab === "finding" ? (
          <FindingFields dealId={dealId} documentOptions={documentOptions} playbookTips={playbookTips} />
        ) : (
          <AssessmentFields
            dealId={dealId}
            initialSummary={initialSummary}
            publishedAt={publishedAt}
          />
        )}
      </div>
    </div>
  );
}

function FindingFields({
  dealId,
  documentOptions,
  playbookTips,
}: {
  dealId: string;
  documentOptions: Array<{ id: string; label: string }>;
  playbookTips: PlaybookTip[];
}) {
  const t = useTranslations("firm.dd");
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [riskCategory, setRiskCategory] = useState<string>(DD_RISK_CATEGORIES[0]!);
  const [playbookAreaId, setPlaybookAreaId] = useState<string>(playbookTips[0]?.areaId ?? "");
  const [playbookOpen, setPlaybookOpen] = useState(false);

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("riskCategoryLabel")} htmlFor="riskCategory">
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
        </Field>
        <Field label={t("riskLevelLabel")} htmlFor="riskLevel">
          <Select id="riskLevel" name="riskLevel" required disabled={pending}>
            {DD_RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {t(`riskLevels.${level}`)}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label={t("sourceDocumentLabel")} htmlFor="sourceDocumentId">
        <Select id="sourceDocumentId" name="sourceDocumentId" disabled={pending}>
          <option value="">{t("noSourceDocument")}</option>
          {documentOptions.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.label}
            </option>
          ))}
        </Select>
      </Field>

      {tipsForRisk.length > 0 ? (
        <div className="rounded-lg border border-border/60 bg-muted/15">
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-between gap-2 px-3 py-2.5 text-left"
            onClick={() => setPlaybookOpen((open) => !open)}
            aria-expanded={playbookOpen}
          >
            <span className="text-xs font-medium text-foreground">{t("playbookAssistTitle")}</span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-muted-foreground transition-transform",
                playbookOpen && "rotate-180",
              )}
            />
          </button>
          {playbookOpen ? (
            <div className="space-y-2 border-t border-border/50 px-3 py-3">
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
                <p className="text-xs font-medium text-foreground">{activeTip?.title}</p>
              )}
              <ul className="space-y-1.5">
                {(activeTip?.checks ?? []).map((check) => (
                  <li key={check} className="text-xs leading-relaxed text-muted-foreground">
                    · {check}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <Field label={t("findingDescriptionLabel")} htmlFor="description">
        <Textarea
          id="description"
          name="description"
          required
          disabled={pending}
          rows={3}
          placeholder={t("findingDescriptionPlaceholder")}
        />
      </Field>

      <Field label={t("recommendedActionLabel")} htmlFor="recommendedAction">
        <Textarea
          id="recommendedAction"
          name="recommendedAction"
          disabled={pending}
          rows={2}
          placeholder={t("recommendedActionPlaceholder")}
        />
      </Field>

      <Field label={t("legalCitationLabel")} htmlFor="legalCitation">
        <input
          id="legalCitation"
          name="legalCitation"
          disabled={pending}
          placeholder={t("legalCitationPlaceholder")}
          className="flex h-10 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground/70 disabled:opacity-50"
        />
      </Field>

      <Button type="submit" disabled={pending} className="w-full cursor-pointer">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {t("saveFinding")}
      </Button>

      {message ? <p className="text-center text-sm text-risk-low">{message}</p> : null}
    </form>
  );
}

function AssessmentFields({
  dealId,
  initialSummary,
  publishedAt,
}: {
  dealId: string;
  initialSummary: string;
  publishedAt: string | null;
}) {
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
    <div className="space-y-4">
      {publishedAt ? (
        <p className="text-xs text-muted-foreground">
          {t("publishedAt", { date: new Date(publishedAt).toLocaleDateString() })}
        </p>
      ) : (
        <p className="text-xs text-muted-foreground">{t("assessmentHint")}</p>
      )}

      <Field label={t("assessmentSummaryLabel")} htmlFor="assessment-summary">
        <Textarea
          id="assessment-summary"
          value={summary}
          disabled={pending}
          rows={8}
          placeholder={t("assessmentPlaceholder")}
          onChange={(e) => setSummary(e.target.value)}
        />
      </Field>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending}
          className="cursor-pointer"
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
          className="cursor-pointer"
          onClick={downloadReport}
        >
          <Download className="h-4 w-4" />
          {t("downloadReport")}
        </Button>
      </div>

      <div className="flex gap-2 border-t border-border/50 pt-4">
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
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
        {label}
      </Label>
      {children}
    </div>
  );
}
