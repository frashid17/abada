export const locales = ["es-CO", "en-US"] as const;

export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "es-CO";

export function isAppLocale(value: string): value is AppLocale {
  return locales.includes(value as AppLocale);
}
