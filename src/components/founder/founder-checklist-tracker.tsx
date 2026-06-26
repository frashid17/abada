import Link from "next/link";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import { cn } from "@/lib/utils";

type FounderChecklistTrackerProps = {
  documents: DashboardDocument[];
  labels: Record<DocumentStatus, string>;
  stepLabel: (step: number) => string;
  title: string;
};

function trackerTone(status: DocumentStatus, isNext: boolean): string {
  if (status === "complete") {
    return "border-[color-mix(in_oklch,var(--risk-low)_45%,transparent)] bg-[color-mix(in_oklch,var(--risk-low)_12%,transparent)]";
  }
  if (status === "flagged") {
    return "border-[color-mix(in_oklch,var(--risk-med)_45%,transparent)] bg-[color-mix(in_oklch,var(--risk-med)_12%,transparent)]";
  }
  if (isNext || status === "in_review" || status === "draft") {
    return "border-primary/35 bg-primary/8 shadow-soft";
  }
  return "border-border/80 bg-muted/40";
}

export function FounderChecklistTracker({
  documents,
  labels,
  stepLabel,
  title,
}: FounderChecklistTrackerProps) {
  const nextType =
    documents.find((doc) => doc.status !== "complete")?.documentType ?? null;

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">{title}</h2>
      <ol className="grid gap-3 sm:grid-cols-5">
        {documents.map((doc, index) => {
          const isNext = doc.documentType === nextType;
          const isComplete = doc.status === "complete";
          const isActive = isNext || doc.status === "draft" || doc.status === "in_review";

          return (
            <li key={doc.documentType} className="relative">
              {index < documents.length - 1 ? (
                <span
                  className="absolute left-[calc(50%+1.4rem)] top-7 hidden h-px w-[calc(100%-2.8rem)] bg-border sm:block"
                  aria-hidden
                />
              ) : null}
              <Link
                href={`/fundador/documentos/${doc.documentType}`}
                className={cn(
                  "group relative flex h-full flex-col items-center rounded-2xl border p-4 text-center transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card",
                  trackerTone(doc.status, isNext),
                )}
              >
                <span
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold transition-colors",
                    isComplete
                      ? "bg-[color-mix(in_oklch,var(--risk-low)_85%,transparent)] text-[color-mix(in_oklch,var(--risk-low)_55%,var(--fg))]"
                      : isActive
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden />
                  ) : doc.status === "in_review" ? (
                    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  ) : (
                    doc.step
                  )}
                </span>
                <p className="mt-3 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {stepLabel(doc.step)}
                </p>
                <p className="mt-1 line-clamp-2 text-xs font-medium leading-snug text-foreground">
                  {labels[doc.status]}
                </p>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}
