import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type ComplianceStripProps = {
  items: ReadonlyArray<{ icon: LucideIcon; label: string }>;
  className?: string;
};

export function ComplianceStrip({ items, className }: ComplianceStripProps) {
  return (
    <div
      className={cn(
        "surface-panel grid gap-3 rounded-2xl p-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0 lg:divide-x lg:divide-border",
        className,
      )}
    >
      {items.map(({ icon: Icon, label }) => (
        <div
          key={label}
          className="flex items-center gap-3 px-2 py-1 lg:justify-center lg:px-4"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Icon className="h-4 w-4" aria-hidden />
          </div>
          <span className="text-sm font-medium leading-snug text-foreground">{label}</span>
        </div>
      ))}
    </div>
  );
}
