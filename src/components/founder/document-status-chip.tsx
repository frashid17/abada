import type { DocumentStatus } from "@/lib/documents/catalog";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<DocumentStatus, string> = {
  not_started: "border-border/80 bg-muted/80 text-muted-foreground",
  draft: "border-primary/15 bg-primary/8 text-foreground",
  flagged: "border-[color-mix(in_oklch,var(--risk-med)_40%,transparent)] bg-[color-mix(in_oklch,var(--risk-med)_14%,transparent)] text-foreground",
  in_review: "border-primary/25 bg-primary/12 text-primary",
  complete: "border-[color-mix(in_oklch,var(--risk-low)_40%,transparent)] bg-[color-mix(in_oklch,var(--risk-low)_14%,transparent)] text-foreground",
};

type DocumentStatusChipProps = {
  status: DocumentStatus;
  label: string;
  className?: string;
};

export function DocumentStatusChip({ status, label, className }: DocumentStatusChipProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        STATUS_STYLES[status],
        className,
      )}
    >
      {label}
    </span>
  );
}
