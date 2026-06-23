import type { Locale } from "./types";
import esCO from "@/messages/es-CO.json";
import en from "@/messages/en.json";

const messages: Record<Locale, typeof esCO> = {
  "es-CO": esCO,
  en,
};

export function getMessages(locale: Locale) {
  return messages[locale];
}

function getNested(obj: unknown, path: string): string | undefined {
  const keys = path.split(".");
  let current: unknown = obj;

  for (const key of keys) {
    if (typeof current !== "object" || current === null || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[key];
  }

  return typeof current === "string" ? current : undefined;
}

export function t(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const value = getNested(messages[locale], key);
  if (!value) return key;

  if (!params) return value;

  return Object.entries(params).reduce(
    (text, [param, replacement]) =>
      text.replaceAll(`{${param}}`, String(replacement)),
    value,
  );
}

export type Messages = typeof esCO;
