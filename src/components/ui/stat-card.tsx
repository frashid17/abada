import { cn } from "@/lib/utils";

type StatCardProps = {
  value: string;
  label: string;
  className?: string;
};

export function StatCard({ value, label, className }: StatCardProps) {
  return (
    <div
      className={cn(
        "surface-panel rounded-2xl px-5 py-5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card",
        className,
      )}
    >
      <p className="font-serif text-3xl font-semibold tracking-tight text-primary">{value}</p>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{label}</p>
    </div>
  );
}
