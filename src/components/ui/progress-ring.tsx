import { cn } from "@/lib/utils";

type ProgressRingProps = {
  value: number;
  max: number;
  label: string;
  className?: string;
  variant?: "default" | "inverse";
};

export function ProgressRing({
  value,
  max,
  label,
  className,
  variant = "default",
}: ProgressRingProps) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const inverse = variant === "inverse";

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <div className="relative h-20 w-20 shrink-0">
        <svg className="h-20 w-20 -rotate-90" viewBox="0 0 80 80" aria-hidden>
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            className={inverse ? "text-trust-panel-icon-bg" : "text-muted"}
          />
          <circle
            cx="40"
            cy="40"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className={cn(
              "transition-[stroke-dashoffset] duration-500",
              inverse ? "text-trust-panel-accent" : "text-primary",
            )}
          />
        </svg>
        <span
          className={cn(
            "absolute inset-0 flex items-center justify-center text-sm font-semibold",
            inverse ? "text-trust-panel-fg" : "text-foreground",
          )}
        >
          {pct}%
        </span>
      </div>
      <p className={cn("text-sm", inverse ? "text-trust-panel-muted" : "text-muted-foreground")}>
        {label}
      </p>
    </div>
  );
}
