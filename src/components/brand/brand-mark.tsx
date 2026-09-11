import Image from "next/image";
import { BRAND_LOGO_PATH } from "@/lib/brand-assets";
import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
  showWordmark?: boolean;
  wordmark?: string;
  size?: number;
};

export function BrandMark({
  className,
  showWordmark = true,
  wordmark,
  size = 30,
}: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Image
        src={BRAND_LOGO_PATH}
        alt={wordmark ? `${wordmark} logo` : "Abada"}
        width={size}
        height={size}
        className="shrink-0 rounded-lg"
        priority
      />
      {showWordmark && wordmark ? (
        <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
          {wordmark}
        </span>
      ) : null}
    </div>
  );
}
