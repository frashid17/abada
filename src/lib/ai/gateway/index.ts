import { generateText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { buildRuntimeInstructions } from "@/lib/ai/build-prompt";
import {
  loadBrainSystemPrompt,
  loadCorpusInventory,
  summarizeCorpusInventory,
} from "@/lib/ai/brain/loader";
import type { GatewayRequest, GatewayResponse } from "@/lib/ai/brain/types";
import { finalizeGatewayResponse } from "@/lib/ai/guardrails";
import { resolveModelForTask } from "@/lib/ai/gateway/routing";
import { formatKnowledgeContext, searchFirmKnowledge } from "@/lib/ai/retrieval";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

function assertAnthropicConfigured(): void {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is not configured");
  }
}

export async function runAiGateway(request: GatewayRequest): Promise<GatewayResponse> {
  assertAnthropicConfigured();
  const brain = loadBrainSystemPrompt();
  const { model } = resolveModelForTask(request.task);

  let corpusSummary: string | undefined;
  if (request.includeCorpusIndex) {
    const inventory = loadCorpusInventory();
    if (inventory) corpusSummary = summarizeCorpusInventory(inventory);
  }

  let knowledgeContext: string | undefined;
  if (request.tenantId && request.task !== "general") {
    try {
      const results = await searchFirmKnowledge(request.tenantId, request.userMessage, 5);
      knowledgeContext = formatKnowledgeContext(results);
    } catch {
      knowledgeContext = undefined;
    }
  }

  const runtime = buildRuntimeInstructions({
    register: request.register,
    task: request.task,
    locale: request.locale,
    corpusSummary,
  });

  const systemParts = [brain.combined, "---", runtime];
  if (request.sessionContext) {
    systemParts.push("---", "Active document session (reference only — do not recite unless relevant):\n" + request.sessionContext);
  }
  if (knowledgeContext) {
    systemParts.push("---", "Retrieved firm knowledge:\n" + knowledgeContext);
  }
  const system = systemParts.join("\n\n");

  const chatMessages =
    request.history && request.history.length > 0
      ? [
          ...request.history.map((turn) => ({
            role: turn.role as "user" | "assistant",
            content: turn.content,
          })),
          { role: "user" as const, content: request.userMessage },
        ]
      : undefined;

  const result = await generateText({
    model: anthropic(model),
    system,
    ...(chatMessages ? { messages: chatMessages } : { prompt: request.userMessage }),
    maxOutputTokens: request.task === "dd_finding" ? 4096 : 2048,
  });

  try {
    const supabase = createServiceRoleSupabaseClient();
    await supabase.from("ai_call_logs").insert({
      tenant_id: request.tenantId ?? null,
      caller_sub: request.callerSub,
      task: request.task,
      model,
    });
  } catch {
    // Non-blocking audit log
  }

  return finalizeGatewayResponse(
    result.text,
    request.locale,
    model,
    brain.documents.map((d) => d.id),
  );
}
