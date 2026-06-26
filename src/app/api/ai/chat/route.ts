import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { runAiGateway } from "@/lib/ai/gateway";

const bodySchema = z.object({
  message: z.string().min(1).max(8000),
  task: z
    .enum(["drafting", "intake_summary", "dd_finding", "knowledge_hub", "general"])
    .default("general"),
  register: z.enum(["attorney", "founder", "investor"]).default("founder"),
  locale: z.enum(["es-CO", "en-US"]).default("es-CO"),
  includeCorpusIndex: z.boolean().optional(),
  sessionContext: z.string().max(4000).optional(),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(8000),
      }),
    )
    .max(30)
    .optional(),
});

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "AI gateway not configured (ANTHROPIC_API_KEY missing)" },
      { status: 503 },
    );
  }

  try {
    const response = await runAiGateway({
      task: body.task,
      register: body.register,
      locale: body.locale,
      userMessage: body.message,
      callerSub: userId,
      includeCorpusIndex: body.includeCorpusIndex ?? body.task === "knowledge_hub",
      sessionContext: body.sessionContext,
      history: body.history,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error("[ai/chat]", error);
    return NextResponse.json({ error: "AI gateway error" }, { status: 500 });
  }
}
