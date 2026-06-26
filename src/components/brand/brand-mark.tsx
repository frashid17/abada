import { Scale } from "lucide-react";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
  wordmark?: string;
};

export function BrandMark({ className, showWordmark = true, wordmark }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-soft">
        <Scale className="h-4 w-4" strokeWidth={2.25} aria-hidden />
      </div>
      {showWordmark && wordmark ? (
        <span className="font-serif text-lg font-semibold tracking-tight text-foreground">{wordmark}</span>
      ) : null}
    </div>
  );
}
