"use client";

import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Flag, ChevronLeft, ChevronRight, Download, Eye, Save, Send, CheckCircle2, Clock } from "lucide-react";
import type { DocumentStatus } from "@/lib/documents/catalog";
import type { DocumentReviewSummary } from "@/lib/documents/service";
import { getIntakeSchema, type FlowDocumentType } from "@/lib/documents/intake";
import type { FieldValues, IntakeField } from "@/lib/documents/intake/types";
import {
  flagDocumentForHelpAction,
  getDocumentPreviewHtmlAction,
  saveDocumentFieldsAction,
  submitDocumentForReviewAction,
} from "@/lib/documents/actions";
import { DocumentAiPanel } from "@/components/founder/document-ai-panel";
import { DocumentStatusChip } from "@/components/founder/document-status-chip";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type DocumentFlowProps = {
  documentType: FlowDocumentType;
  initialFields: FieldValues;
  status: DocumentStatus;
  helpMessage: string | null;
  reviewSummary: DocumentReviewSummary;
};

export function DocumentFlow({
  documentType,
  initialFields,
  status,
  helpMessage,
  reviewSummary,
}: DocumentFlowProps) {
  const t = useTranslations("founder.flow");
  const tDocs = useTranslations("founder.documents");
  const tStatus = useTranslations("founder.dashboard.status");
  const locale = useLocale() as "es-CO" | "en-US";
  const router = useRouter();
  const schema = getIntakeSchema(documentType)!;

  const [step, setStep] = useState(1);
  const [documentLocale, setDocumentLocale] = useState<"es-CO" | "en-US">(locale);
  const [fields, setFields] = useState<FieldValues>({
    vesting_months: 48,
    cliff_months: 12,
    term_years: 2,
    agreement_mode: "mutual",
    acceleration_type: "none",
    departure_treatment: "forfeit",
    assignment_scope: "all_current_future",
    contract_type: "indefinite",
    non_compete: "none",
    tag_along_enabled: "yes",
    anti_dilution: "broad_based",
    drag_along_threshold_pct: 75,
    qualified_majority_pct: 66,
    dispute_resolution: "arbitration",
    ...initialFields,
  });
  const [helpText, setHelpText] = useState(helpMessage ?? "");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const stepFields = useMemo(
    () => schema.fields.filter((field) => field.step === step),
    [schema.fields, step],
  );

  function updateField(key: string, value: string | number | boolean) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  function renderField(field: IntakeField) {
    const label = t(`fields.${documentType}.${field.labelKey}`);
    const placeholder = field.placeholderKey
      ? t(`placeholders.${documentType}.${field.placeholderKey}`)
      : undefined;
    const help = field.helpKey ? t(`help.${documentType}.${field.helpKey}`) : undefined;
    const value = fields[field.key] ?? "";

    const common = {
      id: field.key,
      disabled: pending,
      required: field.required,
    };

    return (
      <div key={field.key} className="space-y-2">
        <Label htmlFor={field.key}>{label}</Label>
        {field.type === "textarea" ? (
          <Textarea
            {...common}
            value={String(value)}
            placeholder={placeholder}
            onChange={(e) => updateField(field.key, e.target.value)}
          />
        ) : field.type === "select" ? (
          <Select
            {...common}
            value={String(value)}
            onChange={(e) => updateField(field.key, e.target.value)}
          >
            <option value="">{t("selectOption")}</option>
            {field.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {t(`options.${documentType}.${option.labelKey}`)}
              </option>
            ))}
          </Select>
        ) : (
          <Input
            {...common}
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
            value={String(value)}
            placeholder={placeholder}
            onChange={(e) =>
              updateField(
                field.key,
                field.type === "number" ? Number(e.target.value) : e.target.value,
              )
            }
          />
        )}
        {help ? <p className="text-xs text-muted-foreground">{help}</p> : null}
      </div>
    );
  }

  function handleSave() {
    startTransition(async () => {
      const result = await saveDocumentFieldsAction(documentType, fields);
      if (result.ok) {
        setMessage(t("saved"));
      } else {
        setMessage(result.error ?? t("saveError"));
      }
    });
  }

  function handlePreview() {
    startTransition(async () => {
      await saveDocumentFieldsAction(documentType, fields);
      const result = await getDocumentPreviewHtmlAction(documentType, documentLocale);
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setPreviewHtml(result.html);
      if (result.missingFields.length > 0) {
        setMessage(t("previewIncomplete"));
      }
    });
  }

  function handleDownload() {
    startTransition(async () => {
      const result = await saveDocumentFieldsAction(documentType, fields);
      if (!result.ok) {
        setMessage(result.error ?? t("saveError"));
        return;
      }
      window.location.href = `/api/documents/${documentType}/download?locale=${documentLocale}`;
    });
  }

  function handleSubmitForReview() {
    startTransition(async () => {
      const saveResult = await saveDocumentFieldsAction(documentType, fields);
      if (!saveResult.ok) {
        setMessage(saveResult.error ?? t("saveError"));
        return;
      }

      const result = await submitDocumentForReviewAction(
        documentType,
        helpText.trim() || undefined,
      );

      if (result.ok) {
        setMessage(t("reviewSent"));
        router.refresh();
      } else if (result.error?.includes("already submitted")) {
        setMessage(t("reviewAlreadySubmitted"));
      } else if (result.error?.includes("Missing required")) {
        setMessage(t("reviewIncomplete"));
      } else {
        setMessage(result.error ?? t("reviewError"));
      }
    });
  }

  const isReviewComplete = status === "complete" || reviewSummary.phase === "completed";
  const isPendingReview =
    !isReviewComplete && (status === "in_review" || reviewSummary.phase === "pending");

  function formatReviewDate(iso: string) {
    return new Date(iso).toLocaleDateString(locale, { dateStyle: "long" });
  }

  const submittedNote =
    reviewSummary.phase === "pending" || reviewSummary.phase === "completed"
      ? reviewSummary.note
      : helpMessage;

  function handleFlagHelp() {
    if (!helpText.trim()) {
      setMessage(t("helpRequired"));
      return;
    }
    startTransition(async () => {
      const result = await flagDocumentForHelpAction(documentType, helpText.trim());
      setMessage(result.ok ? t("helpSent") : (result.error ?? t("helpError")));
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_minmax(0,420px)] xl:grid-cols-[1fr_440px]">
      <div className="space-y-6 min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <DocumentStatusChip status={status} label={tStatus(status)} />
          <p className="text-sm text-muted-foreground">
            {t("stepProgress", { step, total: schema.steps })}
          </p>
        </div>

        <Card variant="elevated">
          <CardHeader>
            <CardTitle>{t(`steps.${documentType}.${step}`)}</CardTitle>
            <CardDescription>{t(`stepsDescription.${documentType}.${step}`)}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">{stepFields.map(renderField)}</CardContent>
        </Card>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending || step <= 1}
            onClick={() => setStep((s) => s - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            {t("back")}
          </Button>
          {step < schema.steps ? (
            <Button
              type="button"
              size="sm"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  await saveDocumentFieldsAction(documentType, fields);
                  setStep((s) => s + 1);
                });
              }}
            >
              {t("next")}
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : null}
          <Button type="button" variant="secondary" size="sm" disabled={pending} onClick={handleSave}>
            <Save className="h-4 w-4" />
            {t("saveDraft")}
          </Button>
        </div>

        {step === schema.steps ? (
          <Card variant="feature">
            <CardHeader>
              <CardTitle className="text-lg">
                {isReviewComplete ? t("finalizeTitleReviewed") : t("finalizeTitle")}
              </CardTitle>
              <CardDescription>
                {isReviewComplete
                  ? t("finalizeDescriptionReviewed")
                  : isPendingReview
                    ? t("finalizeDescriptionPending")
                    : t("finalizeDescription")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="document-locale">{t("documentLanguageLabel")}</Label>
                <Select
                  id="document-locale"
                  value={documentLocale}
                  disabled={pending}
                  onChange={(e) => setDocumentLocale(e.target.value as "es-CO" | "en-US")}
                >
                  <option value="es-CO">{t("documentLanguage.es-CO")}</option>
                  <option value="en-US">{t("documentLanguage.en-US")}</option>
                </Select>
                <p className="text-xs text-muted-foreground">{t("documentLanguageHint")}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handlePreview}>
                  <Eye className="h-4 w-4" />
                  {t("preview")}
                </Button>
                <Button type="button" size="sm" disabled={pending} onClick={handleDownload}>
                  <Download className="h-4 w-4" />
                  {isReviewComplete ? t("downloadReviewed") : t("download")}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {step === schema.steps ? (
          isReviewComplete ? (
            <Card className="border-[color-mix(in_oklch,var(--risk-low)_40%,transparent)] bg-[color-mix(in_oklch,var(--risk-low)_10%,transparent)]">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--risk-low)]" />
                  <div className="space-y-1">
                    <CardTitle className="text-base">{t("reviewCompleteTitle")}</CardTitle>
                    <CardDescription>{t("reviewCompleteDescription")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {reviewSummary.phase === "completed" ? (
                  <dl className="grid gap-2 sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("reviewCompleteAttorney")}</dt>
                      <dd className="font-medium">{reviewSummary.attorneyName}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-muted-foreground">{t("reviewCompleteDate")}</dt>
                      <dd className="font-medium">{formatReviewDate(reviewSummary.reviewedAt)}</dd>
                    </div>
                  </dl>
                ) : null}
                {submittedNote ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("reviewPendingNoteLabel")}</p>
                    <p className="mt-1 text-muted-foreground">{submittedNote}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : isPendingReview ? (
            <Card>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div className="space-y-1">
                    <CardTitle className="text-base">{t("reviewPendingTitle")}</CardTitle>
                    <CardDescription>{t("reviewPendingDescription")}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {reviewSummary.phase === "pending" ? (
                  <p className="text-muted-foreground">
                    {t("reviewPendingSubmitted", {
                      date: formatReviewDate(reviewSummary.submittedAt),
                    })}
                  </p>
                ) : null}
                {submittedNote ? (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">{t("reviewPendingNoteLabel")}</p>
                    <p className="mt-1 text-muted-foreground">{submittedNote}</p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("reviewTitle")}</CardTitle>
                <CardDescription>{t("reviewDescription")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={helpText}
                  disabled={pending}
                  placeholder={t("reviewPlaceholder")}
                  onChange={(e) => setHelpText(e.target.value)}
                />
                <Button type="button" size="sm" disabled={pending} onClick={handleSubmitForReview}>
                  <Send className="h-4 w-4" />
                  {t("sendForReview")}
                </Button>
              </CardContent>
            </Card>
          )
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("helpTitle")}</CardTitle>
            <CardDescription>{t("helpDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={helpText}
              disabled={pending}
              placeholder={t("helpPlaceholder")}
              onChange={(e) => setHelpText(e.target.value)}
            />
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleFlagHelp}>
              <Flag className="h-4 w-4" />
              {t("flagHelp")}
            </Button>
          </CardContent>
        </Card>

        {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
        <LegalDisclosure message={t("disclaimer")} />
      </div>

      <div className="min-w-0 lg:sticky lg:top-24">
        <DocumentAiPanel
          documentType={documentType}
          documentTitle={tDocs(`${documentType}.title`)}
          fields={fields}
          fieldKeys={schema.fields.map((field) => field.key)}
        />
      </div>

      {previewHtml ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="font-medium">{t("preview")}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>
                {t("closePreview")}
              </Button>
            </div>
            <iframe
              title={t("preview")}
              srcDoc={previewHtml}
              className="h-[70vh] w-full bg-white"
              sandbox=""
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
