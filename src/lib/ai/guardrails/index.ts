import type { GatewayResponse } from "@/lib/ai/brain/types";

const DISCLAIMERS = {
  "es-CO": {
    standard:
      "Esta respuesta fue generada con asistencia de IA y no constituye asesoría legal ni crea relación abogado-cliente. Un abogado de Balam Legal debe revisar cualquier decisión con consecuencias legales.",
    document:
      "Este documento fue generado con asistencia de IA. No constituye asesoría legal. Solicite revisión por un abogado nombrado antes de firmar o compartir.",
    dd: "Este análisis de due diligence fue generado con asistencia de IA. Las conclusiones requieren validación por la firma antes de tomar decisiones de inversión.",
  },
  "en-US": {
    standard:
      "This response was generated with AI assistance and is not legal advice and does not create an attorney-client relationship. A Balam Legal attorney must review any decision with legal consequences.",
    document:
      "This document was generated with AI assistance. It is not legal advice. Obtain named-attorney review before signing or sharing.",
    dd: "This due diligence analysis was generated with AI assistance. Conclusions require firm validation before investment decisions.",
  },
} as const;

export type DisclaimerKind = keyof (typeof DISCLAIMERS)["es-CO"];

export function getDisclaimer(
  locale: "es-CO" | "en-US",
  kind: DisclaimerKind = "standard",
): string {
  return DISCLAIMERS[locale][kind];
}

export function stripAppendedDisclaimer(text: string, disclaimer: string): string {
  const trimmed = text.trim();
  const suffix = `\n\n---\n\n${disclaimer}`;
  if (trimmed.endsWith(suffix)) {
    return trimmed.slice(0, -suffix.length).trim();
  }
  return trimmed;
}

export function appendDisclaimer(
  text: string,
  locale: "es-CO" | "en-US",
  kind: DisclaimerKind = "standard",
): string {
  const disclaimer = getDisclaimer(locale, kind);
  return `${text.trim()}\n\n---\n\n${disclaimer}`;
}

export function guardrailCheck(text: string): { passed: boolean; notes: string[] } {
  const notes: string[] = [];
  const lower = text.toLowerCase();

  if (/\b(guarantee|guaranteed|100% certain|definitely win)\b/i.test(text)) {
    notes.push("Avoid outcome predictions.");
  }

  if (/\b(ley|law|artículo|article)\s+\d+/i.test(text) && lower.includes("todo(legal)") === false) {
    // Soft check — flag for human review when citing numbered norms without corpus grounding
    notes.push("Contains legal citations — verify against corpus.");
  }

  if (text.length > 12000) {
    notes.push("Response unusually long.");
  }

  return { passed: notes.length === 0, notes };
}

export function finalizeGatewayResponse(
  text: string,
  locale: "es-CO" | "en-US",
  model: string,
  brainDocumentIds: string[],
  kind: DisclaimerKind = "standard",
): GatewayResponse {
  const guardrail = guardrailCheck(text);
  const withDisclaimer = appendDisclaimer(text, locale, kind);

  return {
    text: withDisclaimer,
    disclaimer: getDisclaimer(locale, kind),
    model,
    brainDocumentIds,
    passedGuardrails: guardrail.passed,
    guardrailNotes: guardrail.notes,
  };
}
