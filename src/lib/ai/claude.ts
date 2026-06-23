import Anthropic from "@anthropic-ai/sdk";
import { buildSystemPrompt, getModelForTask } from "./prompts";
import type { AiAudience } from "./prompts";
import type { Locale } from "@/lib/i18n/types";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function chatWithClaude({
  messages,
  locale,
  audience,
  complexity = "simple",
}: {
  messages: ChatMessage[];
  locale: Locale;
  audience: AiAudience;
  complexity?: "simple" | "complex";
}): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }

  const client = new Anthropic({ apiKey });
  const system = buildSystemPrompt(locale, audience);

  const response = await client.messages.create({
    model: getModelForTask(complexity),
    max_tokens: 1024,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return block.text;
}

export function getDemoResponse(locale: Locale, audience: AiAudience): string {
  if (locale === "en") {
    if (audience === "founder") {
      return "Vesting means your founder shares are earned over time, usually across four years with a one-year cliff. Almost every investor asks for it before they invest. It's not a penalty — it's a signal of commitment, and we can set it up right here.";
    }
    if (audience === "investor") {
      return "Headline: ownership is clean, but two issues should be resolved before close. First, founder vesting was never implemented. Second, IP from two early contractors was never assigned. Both are fixable pre-close.";
    }
    return "The drag-along threshold here is set at 50%. That's low for this stage. The firm's default is 75%. Recommend confirming with the client before this goes out.";
  }

  if (audience === "founder") {
    return "El vesting significa que tus acciones como fundador se van ganando con el tiempo, normalmente en cuatro años con un año de cliff. Casi todos los inversionistas lo piden antes de invertir. No es un castigo, es una señal de compromiso, y lo podemos dejar listo aquí mismo.";
  }
  if (audience === "investor") {
    return "Resumen: la propiedad está limpia, pero hay dos temas que conviene resolver antes del cierre. Primero, nunca se implementó el vesting de fundadores. Segundo, la PI de dos contratistas tempranos nunca se cedió a la compañía. Ambos son subsanables antes del cierre.";
  }
  return "El umbral de drag-along aquí está en 50%. Es bajo para una empresa en esta etapa. El estándar de la firma es 75%. Recomiendo confirmar el umbral con el cliente antes de enviar.";
}
