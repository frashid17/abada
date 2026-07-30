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
  const showCta = nextDocument && isDocumentFlowReady();
  const pct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <section
      className={cn(
        "relative overflow-hidden rounded-3xl border border-border/60",
        "bg-trust-panel text-trust-panel-foreground shadow-glow",
      )}
    >
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklch, var(--trust-panel-fg) 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklch, var(--trust-panel-fg) 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 70% at 70% 20%, black, transparent)",
        }}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-trust-panel-accent/20 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-28 left-1/4 h-72 w-72 rounded-full bg-primary/25 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute right-1/3 top-1/2 h-40 w-40 -translate-y-1/2 rounded-full bg-cta/15 blur-3xl"
        aria-hidden
      />

      <div className="relative grid gap-8 p-6 sm:p-8 lg:grid-cols-[1.15fr_auto] lg:items-center lg:gap-12 lg:p-10">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-trust-panel-accent/25 bg-trust-panel-icon-bg/60 px-3 py-1 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-trust-panel-accent shadow-[0_0_8px_var(--color-trust-panel-accent)]" />
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-trust-panel-accent">
              {eyebrow}
            </p>
          </div>

          <div className="space-y-3">
            <h1 className="max-w-xl font-serif text-4xl font-semibold tracking-tight text-trust-panel-fg sm:text-5xl">
              {title}
            </h1>
            <p className="max-w-lg text-sm leading-relaxed text-trust-panel-muted sm:text-base">
              {subtitle}
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {showCta ? (
              <Button asChild variant="cta" size="lg" className="h-12 rounded-xl px-6 shadow-glow">
                <Link href={`/fundador/documentos/${nextDocument.documentType}`}>
                  <Sparkles className="h-4 w-4" />
                  {continueCta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            ) : null}

            {nextDocumentTitle ? (
              <p className="text-sm text-trust-panel-muted sm:pl-1">
                <span className="font-medium text-trust-panel-fg">{nextDocumentTitle}</span>
              </p>
            ) : null}
          </div>

          {/* Mobile progress strip */}
          <div className="space-y-2 lg:hidden">
            <div className="flex items-center justify-between text-xs text-trust-panel-muted">
              <span>{progressLabel}</span>
              <span className="font-semibold tabular-nums text-trust-panel-fg">{pct}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-trust-panel-icon-bg">
              <div
                className="h-full rounded-full bg-gradient-to-r from-trust-panel-accent to-cta transition-all duration-700 ease-out"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block">
          <div
            className={cn(
              "relative flex flex-col items-center gap-4 rounded-3xl border border-trust-panel-accent/20",
              "bg-trust-panel-icon-bg/50 px-8 py-7 shadow-card backdrop-blur-md",
            )}
          >
            <div
              className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-trust-panel-accent/50 to-transparent"
              aria-hidden
            />
            <ProgressRing
              value={completedCount}
              max={totalCount}
              label={progressLabel}
              variant="inverse"
              className="flex-col gap-3 text-center [&_p]:max-w-[9rem]"
            />
          </div>
        </div>
      </div>

      <div className="relative grid gap-px border-t border-trust-panel-accent/15 bg-trust-panel-accent/10 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            icon: FileCheck2,
            label: stats.completed,
            value: completedCount,
            tone: "text-[color-mix(in_oklch,var(--risk-low)_70%,var(--trust-panel-fg))]",
          },
          {
            icon: Sparkles,
            label: stats.inProgress,
            value: insights.inProgressCount,
            tone: "text-trust-panel-accent",
          },
          {
            icon: Flag,
            label: stats.needsAttention,
            value: insights.needsAttentionCount,
            tone: "text-[color-mix(in_oklch,var(--risk-med)_75%,var(--trust-panel-fg))]",
          },
          {
            icon: ArrowRight,
            label: stats.remaining,
            value: insights.remainingCount,
            tone: "text-trust-panel-muted",
          },
        ].map(({ icon: Icon, label, value, tone }) => (
          <div
            key={label}
            className="flex items-center gap-3.5 bg-trust-panel px-5 py-4 transition-colors duration-200 hover:bg-trust-panel-icon-bg/40"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-trust-panel-icon-bg text-trust-panel-accent ring-1 ring-trust-panel-accent/20">
              <Icon className="h-4 w-4" aria-hidden />
            </div>
            <div className="min-w-0">
              <p className={cn("text-2xl font-semibold tabular-nums tracking-tight", tone)}>
                {value}
              </p>
              <p className="truncate text-xs text-trust-panel-muted">{label}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
