import { NextResponse } from "next/server";
import { chatWithClaude, getDemoResponse } from "@/lib/ai/claude";
import type { AiAudience } from "@/lib/ai/prompts";
import type { Locale } from "@/lib/i18n/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const locale = (body.locale ?? "es-CO") as Locale;
    const audience = (body.audience ?? "founder") as AiAudience;
    const messages = body.messages ?? [];

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    let reply: string;

    if (process.env.ANTHROPIC_API_KEY) {
      reply = await chatWithClaude({ messages, locale, audience });
    } else {
      reply = getDemoResponse(locale, audience);
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
