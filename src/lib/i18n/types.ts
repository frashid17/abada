export type Locale = "es-CO" | "en";

export const DEFAULT_LOCALE: Locale = "es-CO";
export const LOCALES: Locale[] = ["es-CO", "en"];

export const LOCALE_LABELS: Record<Locale, string> = {
  "es-CO": "Español",
  en: "English",
};
