import type { LucideIcon } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type AuthFieldProps = {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  disabled?: boolean;
  required?: boolean;
  optional?: boolean;
  optionalLabel?: string;
  hint?: string;
  autoComplete?: string;
  trailing?: React.ReactNode;
  minLength?: number;
};

export function AuthField({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  disabled,
  required,
  optional,
  optionalLabel,
  hint,
  autoComplete,
  trailing,
  minLength,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id} className="inline-flex items-center gap-1">
        <span>{label}</span>
        {required ? (
          <span className="text-destructive" aria-hidden>
            *
          </span>
        ) : null}
        {optional ? (
          <span className="font-normal text-muted-foreground">
            ({optionalLabel ?? "optional"})
          </span>
        ) : null}
      </Label>
      <div className="relative">
        {Icon ? (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
        ) : null}
        <Input
          id={id}
          type={type}
          value={value}
          disabled={disabled}
          required={required}
          minLength={minLength}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-required={required || undefined}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => onChange(e.target.value)}
          className={cn(Icon && "pl-10", trailing && "pr-10")}
        />
        {trailing ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
      {hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
