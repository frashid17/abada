import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

type LegalDisclosureProps = {
  message: string;
  className?: string;
};

export function LegalDisclosure({ message, className }: LegalDisclosureProps) {
  return (
    <div
      role="note"
      className={cn(
        "flex items-start gap-3 rounded-xl border border-border bg-muted px-4 py-3.5 text-sm leading-relaxed text-foreground",
        className,
      )}
    >
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Scale className="h-4 w-4" aria-hidden />
      </div>
      <p>{message}</p>
    </div>
  );
}
