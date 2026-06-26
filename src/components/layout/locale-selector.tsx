"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter as useNextRouter } from "next/navigation";
import { useTransition } from "react";
import { locales, type AppLocale } from "@/i18n/config";
import { usePathname, useRouter } from "@/i18n/navigation";
import { setLocaleCookie } from "@/lib/i18n/actions";
import { Button } from "@/components/ui/button";

const localeShort: Record<AppLocale, string> = {
  "es-CO": "ES",
  "en-US": "EN",
};

export function LocaleSelector() {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("locale");
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  function toggleLocale() {
    const nextLocale = locales.find((value) => value !== locale) ?? "es-CO";

    startTransition(async () => {
      await setLocaleCookie(nextLocale);
      router.replace(pathname, { locale: nextLocale });
      nextRouter.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={toggleLocale}
      aria-label={t("toggle")}
      title={t("toggle")}
      className="min-w-[3.25rem] rounded-lg font-medium"
    >
      <Languages className="h-4 w-4" />
      <span>{localeShort[locale]}</span>
    </Button>
  );
}
