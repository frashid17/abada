import { cn } from "@/lib/utils";

type PageBackdropProps = {
  className?: string;
};

export function PageBackdrop({ className }: PageBackdropProps) {
  return (
    <div aria-hidden className={cn("pointer-events-none fixed inset-0 -z-10 app-mesh", className)}>
      <div
        className="absolute inset-0 opacity-[0.28] dark:opacity-[0.18]"
        style={{
          backgroundImage:
            "linear-gradient(color-mix(in oklch, var(--border) 40%, transparent) 1px, transparent 1px), linear-gradient(90deg, color-mix(in oklch, var(--border) 40%, transparent) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
    </div>
  );
}
