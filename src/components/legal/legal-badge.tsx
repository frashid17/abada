import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type LegalBadgeVariant = "attorney" | "confidential" | "audit" | "ai";

const variantStyles: Record<LegalBadgeVariant, string> = {
  attorney: "border-primary/25 bg-primary/8 text-primary",
  confidential: "border-highlight/30 bg-highlight/10 text-highlight",
  audit: "border-risk-low/30 bg-risk-low/10 text-risk-low",
  ai: "border-border bg-muted text-foreground",
};

type LegalBadgeProps = {
  icon: LucideIcon;
  label: string;
  variant?: LegalBadgeVariant;
  className?: string;
};

export function LegalBadge({ icon: Icon, label, variant = "attorney", className }: LegalBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-semibold tracking-wide",
        variantStyles[variant],
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      {label}
    </span>
  );
}
