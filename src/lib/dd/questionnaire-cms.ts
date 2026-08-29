import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import {
  DD_QUESTION_SEEDS,
  type DdQuestionAnswerType,
  type DdQuestionSection,
} from "@/lib/dd/questionnaire-seed";
import type { DdRiskCategory, DdRiskLevel } from "@/lib/dd/taxonomy";

export type AdminDdQuestion = {
  id: string;
  slug: string;
  sectionKey: DdQuestionSection;
  sortOrder: number;
  qEs: string;
  qEn: string;
  hintEs: string | null;
  hintEn: string | null;
  answerType: DdQuestionAnswerType;
  riskCategory: DdRiskCategory;
  riskLevelIfGap: DdRiskLevel;
  findingEs: string;
  findingEn: string;
  actionEs: string | null;
  actionEn: string | null;
  status: "draft" | "published";
  updatedAt: string;
};

function mapQuestion(row: {
  id: string;
  slug: string;
  section_key: string;
  sort_order: number;
  q_es: string;
  q_en: string;
  hint_es: string | null;
  hint_en: string | null;
  answer_type: string;
  risk_category: string;
  risk_level_if_gap: string;
  finding_es: string;
  finding_en: string;
  action_es: string | null;
  action_en: string | null;
  status: string;
  updated_at: string;
}): AdminDdQuestion {
  return {
    id: row.id,
    slug: row.slug,
    sectionKey: row.section_key as DdQuestionSection,
    sortOrder: row.sort_order,
    qEs: row.q_es,
    qEn: row.q_en,
    hintEs: row.hint_es,
    hintEn: row.hint_en,
    answerType: row.answer_type as DdQuestionAnswerType,
    riskCategory: row.risk_category as DdRiskCategory,
    riskLevelIfGap: row.risk_level_if_gap as DdRiskLevel,
    findingEs: row.finding_es,
    findingEn: row.finding_en,
    actionEs: row.action_es,
    actionEn: row.action_en,
    status: row.status as "draft" | "published",
    updatedAt: row.updated_at,
  };
}

export async function listAdminDdQuestions(): Promise<AdminDdQuestion[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_dd_questions")
    .select("*")
    .order("section_key")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

export async function listPublishedDdQuestions(): Promise<AdminDdQuestion[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_dd_questions")
    .select("*")
    .eq("status", "published")
    .order("section_key")
    .order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapQuestion);
}

export async function seedDdQuestionsFromCode(): Promise<{ inserted: number }> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  let inserted = 0;

  for (const seed of DD_QUESTION_SEEDS) {
    const { data: existing } = await supabase
      .from("platform_dd_questions")
      .select("id")
      .eq("slug", seed.slug)
      .maybeSingle();
    if (existing) continue;

    const { error } = await supabase.from("platform_dd_questions").insert({
      slug: seed.slug,
      section_key: seed.sectionKey,
      sort_order: seed.sortOrder,
      q_es: seed.qEs,
      q_en: seed.qEn,
      hint_es: seed.hintEs ?? null,
      hint_en: seed.hintEn ?? null,
      answer_type: seed.answerType,
      risk_category: seed.riskCategory,
      risk_level_if_gap: seed.riskLevelIfGap,
      finding_es: seed.findingEs,
      finding_en: seed.findingEn,
      action_es: seed.actionEs ?? null,
      action_en: seed.actionEn ?? null,
      status: "published",
      updated_by: userId,
    });
    if (error) throw error;
    inserted += 1;
  }

  await writeAuditLog({
    action: "dd.questions.seed",
    actorSub: userId,
    resourceType: "platform_dd_questions",
    resourceId: "seed",
    metadata: { inserted },
  });

  return { inserted };
}

export async function upsertAdminDdQuestion(input: {
  id?: string;
  slug: string;
  sectionKey: DdQuestionSection;
  sortOrder: number;
  qEs: string;
  qEn: string;
  hintEs?: string;
  hintEn?: string;
  answerType: DdQuestionAnswerType;
  riskCategory: string;
  riskLevelIfGap: string;
  findingEs: string;
  findingEn: string;
  actionEs?: string;
  actionEn?: string;
  status: "draft" | "published";
}): Promise<void> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const payload = {
    slug: input.slug.trim(),
    section_key: input.sectionKey,
    sort_order: input.sortOrder,
    q_es: input.qEs.trim(),
    q_en: input.qEn.trim(),
    hint_es: input.hintEs?.trim() || null,
    hint_en: input.hintEn?.trim() || null,
    answer_type: input.answerType,
    risk_category: input.riskCategory,
    risk_level_if_gap: input.riskLevelIfGap,
    finding_es: input.findingEs.trim(),
    finding_en: input.findingEn.trim(),
    action_es: input.actionEs?.trim() || null,
    action_en: input.actionEn?.trim() || null,
    status: input.status,
    updated_by: userId,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase
      .from("platform_dd_questions")
      .update(payload)
      .eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("platform_dd_questions").insert(payload);
    if (error) throw error;
  }

  await writeAuditLog({
    action: input.id ? "dd.questions.update" : "dd.questions.create",
    actorSub: userId,
    resourceType: "platform_dd_questions",
    resourceId: input.id ?? input.slug,
  });
}

export async function setDdQuestionStatus(
  id: string,
  status: "draft" | "published",
): Promise<void> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_dd_questions")
    .update({ status, updated_by: userId, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteAdminDdQuestion(id: string): Promise<void> {
  const userId = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("platform_dd_questions").delete().eq("id", id);
  if (error) throw error;
  await writeAuditLog({
    action: "dd.questions.delete",
    actorSub: userId,
    resourceType: "platform_dd_questions",
    resourceId: id,
  });
}
