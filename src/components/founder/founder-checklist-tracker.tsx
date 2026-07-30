import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import { DOCUMENT_ICONS } from "@/components/founder/document-icons";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import { cn } from "@/lib/utils";

type FounderChecklistTrackerProps = {
  documents: DashboardDocument[];
  labels: Record<DocumentStatus, string>;
  documentTitles: Record<string, string>;
  stepLabel: (step: number) => string;
  title: string;
  subtitle?: string;
};

function trackerTone(status: DocumentStatus, isNext: boolean): string {
  if (status === "complete") {
    return "border-[color-mix(in_oklch,var(--risk-low)_40%,transparent)] bg-[color-mix(in_oklch,var(--risk-low)_10%,var(--surface))]";
  }
  if (status === "flagged") {
    return "border-[color-mix(in_oklch,var(--risk-med)_45%,transparent)] bg-[color-mix(in_oklch,var(--risk-med)_10%,var(--surface))]";
  }
  if (isNext || status === "in_review" || status === "draft") {
    return "border-primary/40 bg-gradient-to-b from-primary/12 to-card shadow-glow";
  }
  return "border-border/70 bg-card/70";
}

export function FounderChecklistTracker({
  documents,
  labels,
  documentTitles,
  stepLabel,
  title,
  subtitle,
}: FounderChecklistTrackerProps) {
  const nextType =
    documents.find((doc) => doc.status !== "complete")?.documentType ?? null;
  const completedThrough = documents.filter((d) => d.status === "complete").length;
  const progressPct =
    documents.length > 1 ? (completedThrough / (documents.length - 1)) * 100 : 0;

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          {subtitle ? (
            <p className="max-w-xl text-sm text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <p className="rounded-full border border-border/70 bg-muted/40 px-3 py-1 text-xs font-medium tabular-nums text-muted-foreground">
          {completedThrough}/{documents.length}
        </p>
      </div>

      <div className="relative rounded-3xl border border-border/60 bg-card/60 p-4 shadow-soft backdrop-blur-sm sm:p-5">
        {/* Progress rail (desktop) */}
        <div
          className="pointer-events-none absolute left-[10%] right-[10%] top-[2.85rem] hidden h-0.5 overflow-hidden rounded-full bg-border/80 sm:block"
          aria-hidden
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[color-mix(in_oklch,var(--risk-low)_80%,transparent)] via-primary to-primary/40 transition-all duration-700 ease-out"
            style={{ width: `${Math.min(100, progressPct)}%` }}
          />
        </div>

        <ol className="relative grid gap-3 sm:grid-cols-5 sm:gap-2.5">
          {documents.map((doc) => {
            const isNext = doc.documentType === nextType;
            const isComplete = doc.status === "complete";
            const isActive =
              isNext || doc.status === "draft" || doc.status === "in_review";
            const Icon = DOCUMENT_ICONS[doc.documentType];
            const docTitle = documentTitles[doc.documentType] ?? doc.documentType;

            return (
              <li key={doc.documentType} className="relative">
                <Link
                  href={`/fundador/documentos/${doc.documentType}`}
                  className={cn(
                    "group relative flex h-full cursor-pointer flex-col items-center rounded-2xl border p-3.5 text-center",
                    "transition-all duration-200 hover:-translate-y-1 hover:shadow-card",
                    trackerTone(doc.status, isNext),
                    isNext && "ring-1 ring-primary/25",
                  )}
                >
                  {isNext ? (
                    <span
                      className="pointer-events-none absolute -inset-px rounded-2xl bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                      aria-hidden
                    />
                  ) : null}

                  <span
                    className={cn(
                      "relative z-10 flex h-12 w-12 items-center justify-center rounded-2xl text-sm font-bold transition-transform duration-200 group-hover:scale-105",
                      isComplete
                        ? "bg-[color-mix(in_oklch,var(--risk-low)_25%,transparent)] text-[color-mix(in_oklch,var(--risk-low)_55%,var(--fg))]"
                        : isActive
                          ? "bg-primary text-primary-foreground shadow-soft"
                          : "bg-muted/80 text-muted-foreground",
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="h-5 w-5" aria-hidden />
                    ) : doc.status === "in_review" ? (
                      <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                    ) : (
                      <Icon className="h-5 w-5" aria-hidden />
                    )}
                    {isNext && !isComplete ? (
                      <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cta text-[9px] font-bold text-cta-foreground ring-2 ring-card">
                        {doc.step}
                      </span>
                    ) : null}
                  </span>

                  <p className="relative z-10 mt-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    {stepLabel(doc.step)}
                  </p>
                  <p className="relative z-10 mt-1 line-clamp-2 min-h-[2.25rem] text-xs font-semibold leading-snug text-foreground">
                    {docTitle}
                  </p>
                  <p
                    className={cn(
                      "relative z-10 mt-2 rounded-full px-2 py-0.5 text-[10px] font-medium",
                      isComplete
                        ? "bg-[color-mix(in_oklch,var(--risk-low)_15%,transparent)] text-[color-mix(in_oklch,var(--risk-low)_50%,var(--fg))]"
                        : isNext
                          ? "bg-primary/15 text-primary"
                          : "bg-muted/60 text-muted-foreground",
                    )}
                  >
                    {labels[doc.status]}
                  </p>
                </Link>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
