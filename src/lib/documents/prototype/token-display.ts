import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";
import type { PrototypeTokenMeta } from "@/lib/documents/prototype/types";

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
] as const;

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export function formatPrototypeDate(value: string, lang: "es" | "en"): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return value;
  const day = Number(match[3]);
  const month = Number(match[2]) - 1;
  const year = match[1];
  if (lang === "en") return `${MONTHS_EN[month]} ${day}, ${year}`;
  return `${day} de ${MONTHS_ES[month]} de ${year}`;
}

export function getTokenSample(
  key: string,
  lang: "es" | "en",
  tokens: Record<string, PrototypeTokenMeta> = SEED_PROTOTYPE_CONTENT.tokens,
): string {
  const meta = tokens[key];
  if (!meta) return "";
  const sample = lang === "en" ? meta.sample_en : meta.sample_es;
  if (!sample) return lang === "en" ? meta.en : meta.es;
  if (meta.type === "date") return formatPrototypeDate(sample, lang);
  return sample;
}

/** Raw sample value for form inputs (e.g. ISO date strings). */
export function getTokenSampleRaw(
  key: string,
  lang: "es" | "en",
  tokens: Record<string, PrototypeTokenMeta> = SEED_PROTOTYPE_CONTENT.tokens,
): string {
  const meta = tokens[key];
  if (!meta) return "";
  const sample = lang === "en" ? meta.sample_en : meta.sample_es;
  if (sample) return sample;
  return lang === "en" ? meta.en : meta.es;
}

export function resolveTokenDisplay(
  key: string,
  value: string,
  lang: "es" | "en",
  tokens: Record<string, PrototypeTokenMeta> = SEED_PROTOTYPE_CONTENT.tokens,
): { label: string; isUserValue: boolean } {
  const meta = tokens[key];
  const trimmed = value.trim();
  if (trimmed) {
    const label = meta?.type === "date" ? formatPrototypeDate(trimmed, lang) : trimmed;
    return { label, isUserValue: true };
  }
  return { label: getTokenSample(key, lang, tokens) || key, isUserValue: false };
}
