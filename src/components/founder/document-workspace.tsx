"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  ChevronRight,
  Download,
  Eye,
  FileText,
  Flag,
  Lightbulb,
  Save,
  Scale,
  Send,
  Shield,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import type { DocumentStatus } from "@/lib/documents/catalog";
import type { DocumentReviewSummary } from "@/lib/documents/service";
import type { EditableDocumentBody } from "@/lib/documents/editable-body";
import { getIntakeSchema, type FlowDocumentType } from "@/lib/documents/intake";
import type { FieldValues, IntakeField } from "@/lib/documents/intake/types";
import type { DocumentClause } from "@/lib/documents/learn/parse-clauses";
import {
  flagDocumentForHelpAction,
  getDocumentPreviewHtmlAction,
  getEditableDocumentBodyAction,
  saveDocumentFieldsAction,
  submitDocumentForReviewAction,
} from "@/lib/documents/actions";
import { DocumentAiPanel } from "@/components/founder/document-ai-panel";
import { DocumentStatusChip } from "@/components/founder/document-status-chip";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DocumentWorkspaceProps = {
  documentType: FlowDocumentType;
  initialFields: FieldValues;
  initialBody: EditableDocumentBody;
  status: DocumentStatus;
  helpMessage: string | null;
  reviewSummary: DocumentReviewSummary;
  aiAccess: {
    hasAccess: boolean;
    paywallEnabled: boolean;
    amountFormatted: string;
  };
  /** When set, show firm clause guides in the side panel (shareholders / employment). */
  learnGuideType?: "shareholders" | "employment";
};

type CalloutConfig = {
  keys: string[];
  clauseMap: Record<string, string>;
  icons: Record<string, typeof Scale>;
};

const WORKSPACE_CALLOUTS: Partial<Record<FlowDocumentType, CalloutConfig>> = {
  shareholders: {
    keys: ["dragAlong", "antiDilution", "vesting"],
    clauseMap: { dragAlong: "3", antiDilution: "5", vesting: "7" },
    icons: { dragAlong: Scale, antiDilution: ChevronRight, vesting: Sparkles },
  },
  employment: {
    keys: ["ip", "confidentiality", "termination"],
    clauseMap: { ip: "9", confidentiality: "8", termination: "14" },
    icons: { ip: Lightbulb, confidentiality: Shield, termination: FileText },
  },
  nda: {
    keys: ["mutual", "term", "purpose"],
    clauseMap: { mutual: "2", term: "4", purpose: "1" },
    icons: { mutual: Scale, term: FileText, purpose: Lightbulb },
  },
  vesting: {
    keys: ["cliff", "acceleration", "departure"],
    clauseMap: { cliff: "2", acceleration: "3", departure: "4" },
    icons: { cliff: TrendingUp, acceleration: Sparkles, departure: Shield },
  },
  ip: {
    keys: ["scope", "consideration", "assignment"],
    clauseMap: { scope: "2", consideration: "3", assignment: "1" },
    icons: { scope: Lightbulb, consideration: Scale, assignment: FileText },
  },
};

const FIELD_TOKEN_RE = /⟦(\w+)⟧/g;
const STRUCTURE_KEYS = new Set([
  "agreement_mode",
  "acceleration_type",
  "departure_treatment",
  "assignment_scope",
  "contract_type",
  "non_compete",
  "tag_along_enabled",
  "anti_dilution",
  "dispute_resolution",
]);

function clauseLabel(clause: DocumentClause): string {
  if (clause.id === "preamble") return "Intro";
  return clause.heading?.split(".")[0]?.trim() ?? clause.id;
}

function DefaultFields(documentType: FlowDocumentType): FieldValues {
  return {
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
    ...(documentType === "nda" ? {} : {}),
  };
}

type InlineTextProps = {
  text: string;
  fields: FieldValues;
  fieldByKey: Map<string, IntakeField>;
  documentType: FlowDocumentType;
  pending: boolean;
  onChange: (key: string, value: string | number | boolean) => void;
};

function InlineDocumentText({
  text,
  fields,
  fieldByKey,
  documentType,
  pending,
  onChange,
}: InlineTextProps) {
  const t = useTranslations("founder.flow");
  const parts = text.split(FIELD_TOKEN_RE);

  return (
    <>
      {parts.map((part, index) => {
        if (index % 2 === 0) {
          return part ? (
            <span key={`t-${index}`} className="whitespace-pre-wrap">
              {part}
            </span>
          ) : null;
        }

        const key = part;
        const field = fieldByKey.get(key);
        const value = fields[key] ?? "";
        const label = field
          ? t(`fields.${documentType}.${field.labelKey}`)
          : key;
        const placeholder = field?.placeholderKey
          ? t(`placeholders.${documentType}.${field.placeholderKey}`)
          : label;
        const filled = String(value).trim().length > 0;

        if (field?.type === "select") {
          return (
            <span key={`f-${key}-${index}`} className="inline-flex align-baseline">
              <select
                aria-label={label}
                disabled={pending}
                value={String(value)}
                onChange={(event) => onChange(key, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                  "mx-0.5 max-w-[14rem] rounded-md border px-1.5 py-0.5 text-[0.95em] font-medium shadow-sm transition-colors",
                  filled
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-dashed border-primary/50 bg-primary/5 text-primary",
                )}
              >
                <option value="">{t("selectOption")}</option>
                {field.options?.map((option) => (
                  <option key={option.value} value={option.value}>
                    {t(`options.${documentType}.${option.labelKey}`)}
                  </option>
                ))}
              </select>
            </span>
          );
        }

        if (field?.type === "textarea") {
          return (
            <span key={`f-${key}-${index}`} className="my-2 block">
              <textarea
                aria-label={label}
                disabled={pending}
                rows={3}
                value={String(value)}
                placeholder={placeholder}
                onChange={(event) => onChange(key, event.target.value)}
                onClick={(event) => event.stopPropagation()}
                className={cn(
                  "w-full rounded-lg border px-2.5 py-2 text-sm leading-relaxed shadow-sm transition-colors",
                  filled
                    ? "border-primary/30 bg-background"
                    : "border-dashed border-primary/50 bg-primary/5 placeholder:text-primary/70",
                )}
              />
            </span>
          );
        }

        const inputType =
          field?.type === "number"
            ? "number"
            : field?.type === "email"
              ? "email"
              : field?.type === "date"
                ? "date"
                : "text";

        return (
          <span key={`f-${key}-${index}`} className="inline-flex align-baseline">
            <input
              aria-label={label}
              disabled={pending}
              type={inputType}
              value={String(value)}
              placeholder={placeholder}
              onChange={(event) => {
                const raw = event.target.value;
                onChange(
                  key,
                  field?.type === "number" && raw !== "" ? Number(raw) : raw,
                );
              }}
              onClick={(event) => event.stopPropagation()}
              className={cn(
                "mx-0.5 min-w-[6rem] max-w-[16rem] rounded-md border px-1.5 py-0.5 text-[0.95em] font-medium shadow-sm transition-colors",
                filled
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-dashed border-primary/50 bg-primary/5 text-primary placeholder:text-primary/60",
              )}
            />
          </span>
        );
      })}
    </>
  );
}

export function DocumentWorkspace({
  documentType,
  initialFields,
  initialBody,
  status,
  helpMessage,
  aiAccess,
  learnGuideType,
}: DocumentWorkspaceProps) {
  const t = useTranslations("founder.flow");
  const tLearn = useTranslations("founder.learn");
  const tDocs = useTranslations("founder.documents");
  const tWs = useTranslations("founder.workspace");
  const tStatus = useTranslations("founder.dashboard.status");
  const locale = useLocale() as "es-CO" | "en-US";
  const router = useRouter();
  const schema = getIntakeSchema(documentType)!;

  const [documentLocale, setDocumentLocale] = useState<"es-CO" | "en-US">(locale);
  const [fields, setFields] = useState<FieldValues>({
    ...DefaultFields(documentType),
    ...initialFields,
  });
  const [body, setBody] = useState(initialBody);
  const [activeClauseId, setActiveClauseId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [helpText, setHelpText] = useState(helpMessage ?? "");
  const [previewHtml, setPreviewHtml] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipScrollSelect = useRef(false);

  const fieldByKey = useMemo(
    () => new Map(schema.fields.map((field) => [field.key, field])),
    [schema.fields],
  );

  const fieldKeys = useMemo(() => schema.fields.map((f) => f.key), [schema.fields]);
  const calloutConfig = WORKSPACE_CALLOUTS[documentType];
  const guideType = learnGuideType ?? (documentType === "shareholders" || documentType === "employment"
    ? documentType
    : undefined);

  const clauseCount = body.clauses.filter((c) => c.id !== "preamble").length;
  const activeIndex = activeClauseId
    ? body.clauses.findIndex((c) => c.id === activeClauseId)
    : -1;
  const activePosition = activeIndex >= 0 ? activeIndex + 1 : 0;

  const guideKey =
    guideType && activeClauseId
      ? (`clauses.${guideType}.${activeClauseId}` as const)
      : null;
  const hasGuide = Boolean(guideKey && tLearn.has(`${guideKey}.title`));

  const fieldsInActiveClause = useMemo(() => {
    if (!activeClauseId) return [];
    const clause = body.clauses.find((c) => c.id === activeClauseId);
    if (!clause) return [];
    const keys = new Set<string>();
    const haystack = `${clause.heading ?? ""}\n${clause.body}`;
    for (const match of haystack.matchAll(FIELD_TOKEN_RE)) {
      if (match[1]) keys.add(match[1]);
    }
    return schema.fields.filter((f) => keys.has(f.key));
  }, [activeClauseId, body.clauses, schema.fields]);

  const refreshBody = useCallback(
    (nextFields: FieldValues, nextLocale: "es-CO" | "en-US") => {
      startTransition(async () => {
        const result = await getEditableDocumentBodyAction(
          documentType,
          nextFields,
          nextLocale,
        );
        if ("error" in result) {
          setMessage(result.error);
          return;
        }
        setBody(result);
      });
    },
    [documentType],
  );

  const persistFields = useCallback(
    (nextFields: FieldValues) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        startTransition(async () => {
          const result = await saveDocumentFieldsAction(documentType, nextFields);
          if (!result.ok) {
            setMessage(result.error ?? t("saveError"));
            return;
          }
          setMessage(t("saved"));
          router.refresh();
        });
      }, 700);
    },
    [documentType, router, t],
  );

  function updateField(key: string, value: string | number | boolean) {
    setFields((prev) => {
      const next = { ...prev, [key]: value };
      const isStructure = STRUCTURE_KEYS.has(key) || body.structureFields.some((f) => f.key === key);
      if (isStructure) {
        refreshBody(next, documentLocale);
      }
      persistFields(next);
      return next;
    });
  }

  const selectClause = useCallback((clauseId: string) => {
    setActiveClauseId(clauseId);
  }, []);

  const selectAndScrollToClause = useCallback((clauseId: string) => {
    skipScrollSelect.current = true;
    setActiveClauseId(clauseId);
    const target = scrollRef.current?.querySelector<HTMLElement>(
      `[data-clause-id="${clauseId}"]`,
    );
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      skipScrollSelect.current = false;
    }, 600);
  }, []);

  useEffect(() => {
    function onScroll() {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [body.clauses]);

  useEffect(() => {
    const articles = scrollRef.current?.querySelectorAll<HTMLElement>("[data-clause-id]");
    if (!articles || articles.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (skipScrollSelect.current) return;
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.getAttribute("data-clause-id");
        if (top) setActiveClauseId(top);
      },
      { root: null, threshold: [0.15, 0.35, 0.55], rootMargin: "-20% 0px -55% 0px" },
    );

    articles.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [body.clauses]);

  function renderStructureField(field: IntakeField) {
    const label = t(`fields.${documentType}.${field.labelKey}`);
    const value = fields[field.key] ?? "";

    if (field.type === "select") {
      return (
        <div key={field.key} className="min-w-[10rem] flex-1 space-y-1">
          <Label htmlFor={`struct-${field.key}`} className="text-[11px]">
            {label}
          </Label>
          <Select
            id={`struct-${field.key}`}
            disabled={pending}
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
        </div>
      );
    }

    return (
      <div key={field.key} className="min-w-[10rem] flex-1 space-y-1">
        <Label htmlFor={`struct-${field.key}`} className="text-[11px]">
          {label}
        </Label>
        <Input
          id={`struct-${field.key}`}
          disabled={pending}
          type={field.type === "number" ? "number" : "text"}
          value={String(value)}
          onChange={(e) =>
            updateField(
              field.key,
              field.type === "number" ? Number(e.target.value) : e.target.value,
            )
          }
        />
      </div>
    );
  }

  function saveNow() {
    startTransition(async () => {
      const result = await saveDocumentFieldsAction(documentType, fields);
      if (!result.ok) {
        setMessage(result.error ?? t("saveError"));
        return;
      }
      setMessage(t("saved"));
      router.refresh();
    });
  }

  function openPreview() {
    startTransition(async () => {
      await saveDocumentFieldsAction(documentType, fields);
      const result = await getDocumentPreviewHtmlAction(
        documentType,
        documentLocale,
        fields,
      );
      if ("error" in result) {
        setMessage(result.error);
        return;
      }
      setPreviewHtml(result.html);
    });
  }

  function submitReview() {
    startTransition(async () => {
      await saveDocumentFieldsAction(documentType, fields);
      const result = await submitDocumentForReviewAction(
        documentType,
        helpText.trim() || undefined,
      );
      if (!result.ok) {
        setMessage(result.error ?? t("reviewError"));
        return;
      }
      setMessage(t("reviewSubmitted"));
      router.refresh();
    });
  }

  function flagHelp() {
    if (!helpText.trim()) {
      setMessage(t("helpRequired"));
      return;
    }
    startTransition(async () => {
      const result = await flagDocumentForHelpAction(documentType, helpText.trim());
      if (!result.ok) {
        setMessage(result.error ?? t("helpError"));
        return;
      }
      setMessage(t("helpSent"));
      router.refresh();
    });
  }

  const calloutCards = useMemo(() => {
    if (!calloutConfig) return [];
    return calloutConfig.keys.map((key) => ({
      key,
      clauseId: calloutConfig.clauseMap[key]!,
      Icon: calloutConfig.icons[key]!,
      isActive: activeClauseId === calloutConfig.clauseMap[key],
    }));
  }, [activeClauseId, calloutConfig]);

  return (
    <section className="bg-background pb-16">
      <div className="relative border-b border-border/50 px-4 py-5 sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <DocumentStatusChip status={status} label={tStatus(status)} />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {tWs("eyebrow")}
              </span>
            </div>
            <h1 className="font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {tDocs(`${documentType}.title`)}
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground">
              {tWs("subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Select
              aria-label={t("documentLanguage")}
              value={documentLocale}
              disabled={pending}
              onChange={(e) => {
                const next = e.target.value as "es-CO" | "en-US";
                setDocumentLocale(next);
                refreshBody(fields, next);
              }}
              className="w-auto"
            >
              <option value="es-CO">es-CO</option>
              <option value="en-US">en-US</option>
            </Select>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={saveNow}>
              <Save className="h-4 w-4" />
              {t("saveDraft")}
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={pending} onClick={openPreview}>
              <Eye className="h-4 w-4" />
              {t("preview")}
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href={`/api/documents/${documentType}/download?locale=${documentLocale}`}>
                <Download className="h-4 w-4" />
                {t("download")}
              </a>
            </Button>
          </div>
        </div>

        {calloutCards.length > 0 ? (
          <div className="mt-4 grid gap-2.5 sm:grid-cols-3 lg:max-w-4xl">
            {calloutCards.map(({ key, clauseId, Icon, isActive }) => (
              <button
                key={key}
                type="button"
                onClick={() => selectAndScrollToClause(clauseId)}
                className={cn(
                  "group rounded-xl border p-3 text-left transition-all duration-200",
                  isActive
                    ? "border-primary/40 bg-primary/10 shadow-soft"
                    : "border-border/70 bg-muted/20 hover:border-primary/25 hover:bg-muted/40",
                )}
              >
                <div className="flex items-start gap-2.5">
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary",
                    )}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <div className="min-w-0 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      {guideType && tLearn.has(`callouts.${guideType}.${key}.label`)
                        ? tLearn(`callouts.${guideType}.${key}.label`)
                        : t(`ai.prompts.${documentType}.${key}`)}
                    </p>
                    <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                      {tWs("calloutHint")}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        ) : null}

        {body.structureFields.length > 0 ? (
          <div className="mt-4 rounded-xl border border-border/60 bg-muted/15 p-3 sm:p-4">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {tWs("structureHeading")}
            </p>
            <div className="flex flex-wrap gap-3">
              {body.structureFields.map(renderStructureField)}
            </div>
          </div>
        ) : null}

        {message ? (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <div className="sticky top-14 z-20 border-b border-border/50 bg-background/95 backdrop-blur-sm sm:top-16">
        <div className="flex items-center justify-between gap-3 px-4 py-2.5 sm:px-6">
          <p className="text-xs font-medium text-muted-foreground">
            {tLearn("draftMeta", { count: clauseCount })}
          </p>
          <p className="text-xs text-muted-foreground">{tWs("scrollHint")}</p>
        </div>
        <div className="relative h-0.5 bg-muted/40">
          <div
            className="h-full bg-primary transition-[width] duration-150 ease-out"
            style={{ width: `${scrollProgress}%` }}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_min(400px,38%)]">
        <div
          ref={scrollRef}
          className="border-b border-border/50 px-4 py-6 sm:px-8 sm:py-8 lg:border-b-0 lg:border-r"
        >
          <div className="mx-auto max-w-3xl space-y-3">
            {body.clauses.map((clause) => (
              <div key={clause.id} className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  title={clauseLabel(clause)}
                  onClick={() => selectAndScrollToClause(clause.id)}
                  className={cn(
                    "hidden h-8 w-8 shrink-0 items-center justify-center self-start rounded-md text-[10px] font-bold transition-all lg:flex",
                    activeClauseId === clause.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {clause.id === "preamble" ? "·" : clause.id}
                </button>
                <article
                  id={`clause-${clause.id}`}
                  data-clause-id={clause.id}
                  onClick={() => selectClause(clause.id)}
                  className={cn(
                    "min-w-0 flex-1 scroll-mt-28 rounded-xl border px-4 py-4 text-left transition-all duration-200",
                    "hover:border-primary/25 hover:bg-muted/25",
                    activeClauseId === clause.id
                      ? "border-primary/40 bg-primary/[0.08] shadow-[inset_3px_0_0_0] shadow-primary"
                      : "border-border/30 bg-card/40",
                  )}
                >
                  {clause.heading ? (
                    <h3 className="font-serif text-base font-semibold tracking-tight text-foreground sm:text-[17px]">
                      <InlineDocumentText
                        text={clause.heading}
                        fields={fields}
                        fieldByKey={fieldByKey}
                        documentType={documentType}
                        pending={pending}
                        onChange={updateField}
                      />
                    </h3>
                  ) : null}
                  {clause.body ? (
                    <p className="mt-2.5 text-[15px] leading-[1.75] text-foreground/85 sm:text-base">
                      <InlineDocumentText
                        text={clause.body}
                        fields={fields}
                        fieldByKey={fieldByKey}
                        documentType={documentType}
                        pending={pending}
                        onChange={updateField}
                      />
                    </p>
                  ) : null}
                </article>
              </div>
            ))}
          </div>
        </div>

        <aside className="bg-muted/5 lg:sticky lg:top-[6.75rem] lg:self-start lg:max-h-[calc(100dvh-7.5rem)] lg:overflow-y-auto">
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">
                  {tLearn("panelEyebrow")}
                </p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                {activeClauseId ? `${activePosition}/${body.clauses.length}` : "—"}
              </span>
            </div>

            {hasGuide && guideKey ? (
              <div key={activeClauseId} className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight sm:text-2xl">
                    {tLearn(`${guideKey}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/75">
                    {tLearn(`${guideKey}.summary`)}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Lightbulb className="h-4 w-4" aria-hidden />
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em]">
                      {tLearn("whyItMatters")}
                    </p>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">
                    {tLearn(`${guideKey}.why`)}
                  </p>
                </div>
              </div>
            ) : activeClauseId ? (
              <div className="space-y-3">
                <h3 className="font-serif text-lg font-semibold tracking-tight">
                  {body.clauses.find((c) => c.id === activeClauseId)?.heading ??
                    tWs("clauseFallbackTitle")}
                </h3>
                <p className="text-sm text-muted-foreground">{tWs("fillInHint")}</p>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-center">
                <p className="text-sm font-medium text-foreground">
                  {tLearn("selectClauseTitle")}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {tWs("selectHint")}
                </p>
              </div>
            )}

            {fieldsInActiveClause.length > 0 ? (
              <div className="space-y-3 rounded-xl border border-border/60 bg-card/60 p-3">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {tWs("fieldsInClause")}
                </p>
                {fieldsInActiveClause.map((field) => {
                  const help = field.helpKey
                    ? t(`help.${documentType}.${field.helpKey}`)
                    : null;
                  return (
                    <div key={field.key} className="space-y-1">
                      <p className="text-xs font-semibold text-foreground">
                        {t(`fields.${documentType}.${field.labelKey}`)}
                      </p>
                      {help ? (
                        <p className="text-[11px] leading-relaxed text-muted-foreground">
                          {help}
                        </p>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}

            <div className="space-y-2 border-t border-border/50 pt-4">
              <Label htmlFor="workspace-help">{t("helpTitle")}</Label>
              <Textarea
                id="workspace-help"
                value={helpText}
                disabled={pending}
                rows={2}
                placeholder={t("helpPlaceholder")}
                onChange={(e) => setHelpText(e.target.value)}
              />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={flagHelp}
                >
                  <Flag className="h-4 w-4" />
                  {t("flagHelp")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="cta"
                  disabled={pending}
                  onClick={submitReview}
                >
                  <Send className="h-4 w-4" />
                  {t("sendForReview")}
                </Button>
              </div>
            </div>

            <div className="min-h-[280px]">
              <DocumentAiPanel
                documentType={documentType}
                documentTitle={tDocs(`${documentType}.title`)}
                fields={fields}
                fieldKeys={fieldKeys}
                initialAccess={aiAccess}
              />
            </div>

            <LegalDisclosure message={t("disclaimer")} className="text-[10px]" />
          </div>
        </aside>
      </div>

      {previewHtml ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-sm"
          role="dialog"
          aria-modal
        >
          <div className="flex max-h-[90dvh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{t("preview")}</p>
              <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewHtml(null)}>
                {t("closePreview")}
              </Button>
            </div>
            <iframe title={t("preview")} srcDoc={previewHtml} className="min-h-0 flex-1 bg-white" />
          </div>
        </div>
      ) : null}
    </section>
  );
}
