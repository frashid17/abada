import type { AiTaskKind } from "@/lib/ai/brain/types";

export type ModelTier = "fast" | "strong";

const TASK_TIER: Record<AiTaskKind, ModelTier> = {
  drafting: "fast",
  intake_summary: "fast",
  knowledge_hub: "fast",
  general: "fast",
  dd_finding: "strong",
};

const DEFAULT_MODELS: Record<ModelTier, string> = {
  fast: "claude-haiku-4-5-20251001",
  strong: "claude-sonnet-4-20250514",
};

export function resolveModelForTask(task: AiTaskKind): { tier: ModelTier; model: string } {
  const tier = TASK_TIER[task];
  const envKey = tier === "strong" ? "AI_STRONG_MODEL" : "AI_FAST_MODEL";
  const model = process.env[envKey] ?? DEFAULT_MODELS[tier];
  return { tier, model };
}
