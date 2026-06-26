import Link from "next/link";
import { ArrowRight, Flag, FileCheck2, Sparkles } from "lucide-react";
import { ProgressRing } from "@/components/ui/progress-ring";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardDocument } from "@/lib/documents/dashboard";
import type { FounderDashboardInsights } from "@/lib/documents/dashboard-insights";
import { isDocumentFlowReady } from "@/lib/documents/dashboard-insights";

type FounderDashboardHeroProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  progressLabel: string;
  completedCount: number;
  totalCount: number;
  insights: FounderDashboardInsights;
  nextDocument: DashboardDocument | null;
  nextDocumentTitle: string | null;
  continueCta: string;
  stats: {
    completed: string;
    inProgress: string;
    needsAttention: string;
    remaining: string;
  };
};

export function FounderDashboardHero({
  eyebrow,
  title,
  subtitle,
  progressLabel,
  completedCount,
  totalCount,
  insights,
  nextDocument,
  nextDocumentTitle,
  continueCta,
  stats,
}: FounderDashboardHeroProps) {
  const showCta = nextDocument && isDocumentFlowReady(nextDocument.documentType);

  return (
    <section className="relative overflow-hidden rounded-2xl border border-border/70 bg-trust-panel text-trust-panel-foreground shadow-card">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-trust-panel-accent/15 blur-3xl" aria-hidden />
      <div className="pointer-events-none absolute bottom-0 left-0 h-40 w-40 rounded-full bg-primary/20 blur-3xl" aria-hidden />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
        <div className="space-y-5">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-trust-panel-accent">
            {eyebrow}
          </p>
          <div className="space-y-2">
            <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-trust-panel-muted sm:text-base">
              {subtitle}
            </p>
          </div>

          {showCta ? (
            <Button asChild variant="cta" size="lg" className="shadow-glow">
              <Link href={`/fundador/documentos/${nextDocument.documentType}`}>
                <Sparkles className="h-4 w-4" />
                {continueCta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          ) : null}

          {nextDocumentTitle ? (
            <p className="text-sm text-trust-panel-muted">
              <span className="font-medium text-trust-panel-fg">{nextDocumentTitle}</span>
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4 lg:items-end">
          <ProgressRing
            value={completedCount}
            max={totalCount}
            label={progressLabel}
            variant="inverse"
          />
        </div>
      </div>

      <div className="relative grid border-t border-trust-panel-accent/15 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: FileCheck2, label: stats.completed, value: completedCount },
          { icon: Sparkles, label: stats.inProgress, value: insights.inProgressCount },
          { icon: Flag, label: stats.needsAttention, value: insights.needsAttentionCount },
          { icon: ArrowRight, label: stats.remaining, value: insights.remainingCount },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className={cn(
              "flex items-center gap-3 border-trust-panel-accent/10 px-5 py-4 sm:border-r last:sm:border-r-0 lg:border-r lg:last:border-r-0",
            )}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-trust-panel-icon-bg text-trust-panel-accent">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums text-trust-panel-fg">{value}</p>
              <p className="text-xs text-trust-panel-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
