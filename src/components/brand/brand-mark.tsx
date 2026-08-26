import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
  wordmark?: string;
};

export function BrandMark({ className, showWordmark = true, wordmark }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="grid h-[30px] w-[30px] shrink-0 place-items-center rounded-lg bg-foreground text-[15px] text-background">
        ◈
      </div>
      {showWordmark && wordmark ? (
        <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
          {wordmark}
        </span>
      ) : null}
    </div>
  );
}
