import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type FeaturePanelProps = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
  className?: string;
  tone?: "default" | "trust";
};

export function FeaturePanel({
  icon: Icon,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = "default",
}: FeaturePanelProps) {
  const isTrust = tone === "trust";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border p-6 shadow-soft",
        isTrust
          ? "border-trust-panel-accent/30 bg-trust-panel text-trust-panel-foreground shadow-card"
          : "surface-panel border-border",
        className,
      )}
    >
      {!isTrust ? (
        <div
          className="pointer-events-none absolute right-4 top-4 h-16 w-16 rounded-full border-2 border-dashed border-primary/20 opacity-40"
          aria-hidden
        />
      ) : (
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-trust-panel-accent/10 blur-2xl"
          aria-hidden
        />
      )}
      <div className="relative space-y-4">
        <div className="flex items-center gap-2.5">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ring-1",
              isTrust
                ? "bg-trust-panel-icon-bg text-trust-panel-accent ring-trust-panel-accent/35"
                : "bg-primary/10 text-primary ring-primary/15",
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={2.25} aria-hidden />
          </div>
          <span
            className={cn(
              "text-xs font-bold uppercase tracking-wider",
              isTrust ? "text-trust-panel-accent" : "text-primary",
            )}
          >
            {eyebrow}
          </span>
        </div>
        <div className="space-y-2">
          <h3
            className={cn(
              "font-serif text-xl font-semibold",
              isTrust ? "text-trust-panel-foreground" : "text-foreground",
            )}
          >
            {title}
          </h3>
          <p
            className={cn(
              "text-sm leading-relaxed",
              isTrust ? "text-trust-panel-muted" : "text-muted-foreground",
            )}
          >
            {description}
          </p>
        </div>
        {children}
      </div>
    </div>
  );
}
