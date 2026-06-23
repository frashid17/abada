import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const variants = {
  default: "bg-muted text-foreground",
  primary: "bg-primary-subtle text-primary ring-1 ring-indigo-200",
  warning: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  low: "bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200",
  medium: "bg-orange-50 text-orange-800 ring-1 ring-orange-200",
  high: "bg-rose-50 text-rose-800 ring-1 ring-rose-200",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: keyof typeof variants }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
