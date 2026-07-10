"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  BookOpen,
  ChevronRight,
  FileText,
  Lightbulb,
  Scale,
  Sparkles,
} from "lucide-react";
import type { LearnDocumentPayload } from "@/lib/documents/learn/get-learn-document";
import type { DocumentClause } from "@/lib/documents/learn/parse-clauses";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DocumentLearnViewProps = {
  payload: LearnDocumentPayload;
};

const CALLOUT_KEYS = ["dragAlong", "antiDilution", "vesting"] as const;

const CALLOUT_CLAUSE_MAP: Record<(typeof CALLOUT_KEYS)[number], string> = {
  dragAlong: "3",
  antiDilution: "5",
  vesting: "7",
};

const CALLOUT_ICONS = {
  dragAlong: Scale,
  antiDilution: ChevronRight,
  vesting: Sparkles,
} as const;

function clauseLabel(clause: DocumentClause): string {
  if (clause.id === "preamble") return "Intro";
  return clause.heading?.split(".")[0]?.trim() ?? clause.id;
}

export function DocumentLearnView({ payload }: DocumentLearnViewProps) {
  const t = useTranslations("founder.learn");
  const tDocs = useTranslations("founder.documents");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeClauseId, setActiveClauseId] = useState<string | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const clauseCount = payload.clauses.filter((clause) => clause.id !== "preamble").length;
  const activeIndex = activeClauseId
    ? payload.clauses.findIndex((clause) => clause.id === activeClauseId)
    : -1;
  const activePosition = activeIndex >= 0 ? activeIndex + 1 : 0;

  const selectClause = useCallback((clauseId: string) => {
    setActiveClauseId(clauseId);
  }, []);

  const selectAndScrollToClause = useCallback((clauseId: string) => {
    setActiveClauseId(clauseId);
    const root = scrollRef.current;
    const target = root?.querySelector<HTMLElement>(`[data-clause-id="${clauseId}"]`);
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  useEffect(() => {
    const root = scrollRef.current;
    if (!root) return;

    function onScroll() {
      const element = scrollRef.current;
      if (!element) return;
      const max = element.scrollHeight - element.clientHeight;
      setScrollProgress(max > 0 ? Math.min(100, (element.scrollTop / max) * 100) : 0);
    }

    root.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => root.removeEventListener("scroll", onScroll);
  }, [payload.clauses]);

  const activeKey = activeClauseId
    ? (`clauses.${payload.documentType}.${activeClauseId}` as const)
    : null;

  const calloutCards = useMemo(
    () =>
      CALLOUT_KEYS.map((key) => ({
        key,
        clauseId: CALLOUT_CLAUSE_MAP[key],
        Icon: CALLOUT_ICONS[key],
        isActive: activeClauseId === CALLOUT_CLAUSE_MAP[key],
      })),
    [activeClauseId],
  );

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/60 bg-card shadow-card">
      <div
        className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-16 left-1/4 h-48 w-48 rounded-full bg-trust-panel-accent/10 blur-3xl"
        aria-hidden
      />

      {/* Header */}
      <div className="relative border-b border-border/60 px-5 py-6 sm:px-8 sm:py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
              <FileText className="h-3.5 w-3.5 text-primary" aria-hidden />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {t("documentProgress", { step: payload.step, total: payload.totalSteps })}
              </span>
            </div>
            <div>
              <h2 className="font-serif text-2xl font-semibold tracking-tight sm:text-[1.75rem]">
                {tDocs(`${payload.documentType}.title`)}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {tDocs(`${payload.documentType}.description`)}
              </p>
            </div>
          </div>
          <Button asChild variant="cta" size="sm" className="shrink-0 shadow-glow">
            <Link href={`/fundador/documentos/${payload.documentType}`}>
              {t("continueDrafting")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <p className="mt-5 max-w-3xl text-sm leading-relaxed text-foreground/80">{t("intro")}</p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
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
                    isActive ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div className="min-w-0 space-y-0.5">
                  <p className="text-xs font-semibold text-foreground">{t(`callouts.${key}.label`)}</p>
                  <p className="line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">
                    {t(`callouts.${key}.hint`)}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Split panel */}
      <div className="relative grid lg:grid-cols-[minmax(0,1fr)_min(380px,34%)]">
        {/* Document column */}
        <div className="flex min-h-0 flex-col border-b border-border/60 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 border-b border-border/50 px-5 py-3 sm:px-6">
            <p className="text-xs font-medium text-muted-foreground">
              {t("draftMeta", { count: clauseCount })}
            </p>
            <p className="text-xs text-muted-foreground">{t("clickHint")}</p>
          </div>

          <div className="relative h-1 bg-muted/40">
            <div
              className="h-full bg-primary transition-[width] duration-150 ease-out"
              style={{ width: `${scrollProgress}%` }}
            />
          </div>

          <div className="flex min-h-0 flex-1">
            {/* Clause rail — desktop */}
            <nav
              aria-label={t("panelEyebrow")}
              className="hidden w-14 shrink-0 flex-col gap-1 border-r border-border/50 bg-muted/15 p-2 lg:flex"
            >
              {payload.clauses.map((clause) => (
                <button
                  key={clause.id}
                  type="button"
                  title={clauseLabel(clause)}
                  onClick={() => selectAndScrollToClause(clause.id)}
                  className={cn(
                    "flex h-9 w-full items-center justify-center rounded-lg text-[10px] font-bold transition-all",
                    activeClauseId === clause.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  {clause.id === "preamble" ? "·" : clause.id}
                </button>
              ))}
            </nav>

            <div
              ref={scrollRef}
              className="max-h-[min(68vh,680px)] min-h-[420px] flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6"
            >
              <div className="surface-elevated card-shine mx-auto max-w-2xl space-y-4 rounded-2xl border border-border/60 p-5 shadow-soft sm:p-6">
                {payload.clauses.map((clause) => (
                  <article
                    key={clause.id}
                    id={`clause-${clause.id}`}
                    data-clause-id={clause.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => selectClause(clause.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        selectClause(clause.id);
                      }
                    }}
                    className={cn(
                      "w-full cursor-pointer scroll-mt-4 rounded-xl border px-4 py-4 text-left transition-all duration-200",
                      "hover:border-primary/25 hover:bg-muted/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      activeClauseId === clause.id
                        ? "border-primary/40 bg-primary/[0.08] shadow-[inset_3px_0_0_0] shadow-primary"
                        : "border-border/40 bg-background/50",
                    )}
                  >
                    {clause.heading ? (
                      <h3 className="font-serif text-[15px] font-semibold tracking-tight text-foreground">
                        {clause.heading}
                      </h3>
                    ) : null}
                    {clause.body ? (
                      <p className="mt-2.5 whitespace-pre-wrap text-sm leading-[1.7] text-foreground/85">
                        {clause.body}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Explanation sidebar */}
        <aside className="relative flex flex-col bg-muted/10 lg:sticky lg:top-24 lg:max-h-[min(68vh,680px)]">
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary">
                <BookOpen className="h-4 w-4" aria-hidden />
                <p className="text-[11px] font-bold uppercase tracking-[0.14em]">{t("panelEyebrow")}</p>
              </div>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold tabular-nums text-primary">
                {activeClauseId ? `${activePosition}/${payload.clauses.length}` : "—"}
              </span>
            </div>

            {activeClauseId && activeKey ? (
              <div key={activeClauseId} className="space-y-4 transition-opacity duration-300">
                <div className="space-y-2">
                  <h3 className="font-serif text-xl font-semibold leading-snug tracking-tight">
                    {t(`${activeKey}.title`)}
                  </h3>
                  <p className="text-sm leading-relaxed text-foreground/75">{t(`${activeKey}.summary`)}</p>
                </div>

                <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                  <div className="flex items-center gap-2 text-primary">
                    <Lightbulb className="h-4 w-4" aria-hidden />
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{t("whyItMatters")}</p>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-foreground/90">{t(`${activeKey}.why`)}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-border/70 bg-muted/20 p-5 text-center">
                <p className="text-sm font-medium text-foreground">{t("selectClauseTitle")}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("selectClauseHint")}</p>
              </div>
            )}

            {/* Mobile clause pills */}
            <div className="flex gap-1.5 overflow-x-auto pb-1 lg:hidden">
              {payload.clauses.map((clause) => (
                <button
                  key={clause.id}
                  type="button"
                  onClick={() => selectAndScrollToClause(clause.id)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1 text-[11px] font-medium transition-colors",
                    activeClauseId === clause.id
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {clauseLabel(clause)}
                </button>
              ))}
            </div>
          </div>

          <p className="border-t border-border/50 px-5 py-3 text-[10px] leading-relaxed text-muted-foreground sm:px-6">
            {t("prototypeNote")}
          </p>
        </aside>
      </div>
    </section>
  );
}
