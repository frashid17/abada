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
  autoComplete?: string;
  trailing?: React.ReactNode;
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
  autoComplete,
  trailing,
}: AuthFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
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
          placeholder={placeholder}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value)}
          className={cn(Icon && "pl-10", trailing && "pr-10")}
        />
        {trailing ? (
          <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
        ) : null}
      </div>
    </div>
  );
}
