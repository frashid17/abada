import Link from "next/link";
import { ArrowRight, Clock3, Sparkles } from "lucide-react";
import { DOCUMENT_ICONS } from "@/components/founder/document-icons";
import { DocumentStatusChip } from "@/components/founder/document-status-chip";
import { isDocumentFlowReady } from "@/lib/documents/dashboard-insights";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import { cn } from "@/lib/utils";

type FounderFocusPriorityCardProps = {
  doc: DashboardDocument;
  title: string;
  description: string;
  statusLabel: string;
  stepLabel: string;
  startLabel: string;
  viewLabel: string;
  updatedLabel: string;
  priority?: boolean;
};

export function FounderFocusPriorityCard({
  doc,
  title,
  description,
  statusLabel,
  stepLabel,
  startLabel,
  viewLabel,
  updatedLabel,
  priority = false,
}: FounderFocusPriorityCardProps) {
  const Icon = DOCUMENT_ICONS[doc.documentType];
  const isNotStarted = doc.status === "not_started";
  const flowReady = isDocumentFlowReady();
  const showUpdated =
    doc.status !== "not_started" && doc.updatedAt !== new Date(0).toISOString();
  const ctaLabel = isNotStarted && flowReady ? startLabel : viewLabel;
  const href = `/fundador/documentos/${doc.documentType}`;
  const useCtaStyle = priority && isNotStarted && flowReady;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-2xl border shadow-soft backdrop-blur-sm",
        "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card",
        priority
          ? "border-primary/25 bg-gradient-to-br from-primary/[0.09] via-card to-card ring-1 ring-primary/15"
          : "border-border/60 bg-card/85 hover:border-primary/25",
      )}
    >
      {priority ? (
        <>
          <div
            className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-primary via-cta to-primary/40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-2xl"
            aria-hidden
          />
        </>
      ) : null}

      <div className={cn("flex items-center gap-3.5 p-4 sm:gap-4 sm:p-5", priority && "pl-5")}>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-transform duration-200 group-hover:scale-105 sm:h-12 sm:w-12",
            priority
              ? "bg-primary text-primary-foreground shadow-glow"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {priority ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-cta/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-cta">
                <Sparkles className="h-3 w-3" aria-hidden />
                {stepLabel}
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {stepLabel}
              </span>
            )}
            <DocumentStatusChip
              status={doc.status}
              label={statusLabel}
              className="px-2 py-0 text-[10px]"
            />
            {showUpdated ? (
              <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex">
                <Clock3 className="h-3 w-3" aria-hidden />
                {updatedLabel}
              </span>
            ) : null}
          </div>
          <Link href={href} className="block min-w-0 after:absolute after:inset-0 after:content-['']">
            <p className="truncate font-serif text-base font-semibold leading-snug text-foreground sm:text-lg">
              {title}
            </p>
            <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground sm:text-sm">
              {description}
            </p>
          </Link>
        </div>

        <Link
          href={href}
          className={cn(
            "relative z-10 hidden shrink-0 cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-2.5 text-xs font-medium transition-all sm:inline-flex",
            useCtaStyle
              ? "bg-cta text-cta-foreground shadow-soft hover:opacity-90"
              : "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/50",
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <ArrowRight
          className="relative z-10 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:hidden"
          aria-hidden
        />
      </div>
    </article>
  );
}
