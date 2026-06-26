import Link from "next/link";
import { ArrowRight, Clock3 } from "lucide-react";
import { DOCUMENT_ICONS } from "@/components/founder/document-icons";
import { DocumentStatusChip } from "@/components/founder/document-status-chip";
import { isDocumentFlowReady } from "@/lib/documents/dashboard-insights";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FounderDocumentCardProps = {
  doc: DashboardDocument;
  title: string;
  description: string;
  statusLabel: string;
  stepLabel: string;
  startLabel: string;
  viewLabel: string;
  comingSoonLabel: string;
  updatedLabel: string;
  featured?: boolean;
  featuredLayout?: boolean;
};

export function FounderDocumentCard({
  doc,
  title,
  description,
  statusLabel,
  stepLabel,
  startLabel,
  viewLabel,
  comingSoonLabel,
  updatedLabel,
  featured = false,
  featuredLayout = false,
}: FounderDocumentCardProps) {
  const Icon = DOCUMENT_ICONS[doc.documentType];
  const isNotStarted = doc.status === "not_started";
  const flowReady = isDocumentFlowReady();
  const showUpdated = doc.status !== "not_started" && doc.updatedAt !== new Date(0).toISOString();
  const showFeaturedLayout = featured && featuredLayout;
  const ctaLabel = isNotStarted && flowReady ? startLabel : viewLabel;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border/60",
        "bg-gradient-to-br from-card via-card to-muted/25 shadow-soft backdrop-blur-sm",
        "transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-glow",
        featured && "ring-1 ring-primary/15",
        showFeaturedLayout && "md:flex-row md:items-stretch",
      )}
    >
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/5 blur-3xl transition-colors duration-300 group-hover:bg-primary/10"
        aria-hidden
      />

      <div
        className={cn(
          "relative flex flex-1 flex-col p-5 sm:p-6",
          showFeaturedLayout && "md:max-w-[62%] md:justify-center",
        )}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div
            className={cn(
              "flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300",
              featured
                ? "h-12 w-12 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-soft"
                : "h-11 w-11 bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground",
            )}
          >
            <Icon className={featured ? "h-5 w-5" : "h-5 w-5"} />
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <span className="rounded-full border border-border/60 bg-background/60 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {stepLabel}
            </span>
            {!flowReady ? (
              <span className="rounded-full border border-border/50 bg-muted/40 px-2.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                {comingSoonLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="font-serif text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
            {title}
          </h3>
          <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <DocumentStatusChip status={doc.status} label={statusLabel} />
          {showUpdated ? (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Clock3 className="h-3 w-3" aria-hidden />
              {updatedLabel}
            </span>
          ) : null}
        </div>

        {!showFeaturedLayout ? (
          <div className="mt-5">
            <Button
              asChild
              size="sm"
              variant={featured && isNotStarted && flowReady ? "cta" : "outline"}
              className={cn(
                "w-full rounded-xl",
                featured && isNotStarted && flowReady && "shadow-soft",
              )}
            >
              <Link href={`/fundador/documentos/${doc.documentType}`}>
                {ctaLabel}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      {showFeaturedLayout ? (
        <div className="relative flex items-center justify-center border-t border-border/50 p-5 md:w-[38%] md:border-l md:border-t-0 md:p-6">
          <Button
            asChild
            size="lg"
            variant="cta"
            className="w-full rounded-xl shadow-glow sm:w-auto sm:min-w-[180px]"
          >
            <Link href={`/fundador/documentos/${doc.documentType}`}>
              {ctaLabel}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ) : null}
    </article>
  );
}
