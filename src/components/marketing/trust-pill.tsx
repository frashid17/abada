import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

type TrustPillProps = {
  label: string;
  className?: string;
};

export function TrustPill({ label, className }: TrustPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-highlight/30 bg-highlight/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-highlight",
        className,
      )}
    >
      <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  );
}
