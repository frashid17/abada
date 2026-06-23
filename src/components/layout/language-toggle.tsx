"use client";

import { Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n/provider";
import { LOCALE_LABELS, type Locale } from "@/lib/i18n/types";
import { cn } from "@/lib/utils";

export function LanguageToggle({ className }: { className?: string }) {
  const { locale, setLocale, t } = useI18n();

  const toggle = () => {
    const next: Locale = locale === "es-CO" ? "en" : "es-CO";
    setLocale(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={t("common.language")}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-muted",
        className,
      )}
    >
      <Globe className="h-3.5 w-3.5 text-primary" />
      <span>{LOCALE_LABELS[locale]}</span>
    </button>
  );
}
