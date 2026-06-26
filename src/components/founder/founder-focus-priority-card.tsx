import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
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
  const showUpdated = doc.status !== "not_started" && doc.updatedAt !== new Date(0).toISOString();
  const ctaLabel = isNotStarted && flowReady ? startLabel : viewLabel;
  const href = `/fundador/documentos/${doc.documentType}`;
  const useCtaStyle = priority && isNotStarted && flowReady;

  return (
    <article
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border/60 bg-card/80 shadow-soft backdrop-blur-sm",
        "transition-all duration-200 hover:border-primary/25 hover:bg-card hover:shadow-card",
        priority && "border-primary/20 bg-gradient-to-r from-primary/[0.06] via-card to-card ring-1 ring-primary/10",
      )}
    >
      <div className="flex items-center gap-3 p-3.5 sm:gap-4 sm:p-4">
        <div
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors sm:h-10 sm:w-10 sm:rounded-xl",
            priority
              ? "bg-primary text-primary-foreground shadow-soft"
              : "bg-muted text-muted-foreground",
          )}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </div>

        <div className="min-w-0 flex-1 space-y-0.5">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              {stepLabel}
            </span>
            <DocumentStatusChip status={doc.status} label={statusLabel} className="px-2 py-0 text-[10px]" />
            {showUpdated ? (
              <span className="hidden items-center gap-1 text-[10px] text-muted-foreground sm:inline-flex">
                <Clock3 className="h-3 w-3" aria-hidden />
                {updatedLabel}
              </span>
            ) : null}
          </div>
          <Link href={href} className="block min-w-0 after:absolute after:inset-0 after:content-['']">
            <p className="truncate font-serif text-sm font-semibold leading-snug text-foreground sm:text-base">
              {title}
            </p>
            <p className="line-clamp-1 text-xs leading-relaxed text-muted-foreground">{description}</p>
          </Link>
        </div>

        <Link
          href={href}
          className={cn(
            "relative z-10 hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all sm:inline-flex",
            useCtaStyle
              ? "bg-cta text-cta-foreground shadow-soft hover:opacity-90"
              : "border border-border bg-background text-foreground hover:border-primary/30 hover:bg-muted/50",
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>

        <ArrowRight
          className="relative z-10 h-4 w-4 shrink-0 text-muted-foreground sm:hidden"
          aria-hidden
        />
      </div>
    </article>
  );
}
