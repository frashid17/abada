import { auth } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { assertDealReadAccess, assertFirmDealAccess } from "@/lib/data-room/access";
import {
  listPublishedDdQuestions,
  type AdminDdQuestion,
} from "@/lib/dd/questionnaire-cms";
import { listDealsForParticipant } from "@/lib/deals/service";
import type { DealRecord } from "@/lib/deals/types";

export type DdQuestionnaireRecord = {
  id: string;
  ownerSub: string;
  dealId: string | null;
  tenantId: string | null;
  status: "draft" | "submitted";
  submittedAt: string | null;
  updatedAt: string;
};

export type DdAnswerMap = Record<string, { value: string; note: string }>;

function isGapAnswer(question: AdminDdQuestion, value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  if (question.answerType === "text") return trimmed.length === 0;

  // "Yes" means a problem is present for these declaration-style prompts.
  const gapOnYes = new Set(["incentivos-promesas-verbales", "declaration-litigios"]);
  if (gapOnYes.has(question.slug)) {
    return trimmed === "yes";
  }

  if (trimmed === "yes" || trimmed === "na") return false;
  // "no" or unanswered → gap
  return true;
}

export async function getOrCreateFounderQuestionnaire(
  ownerSub: string,
): Promise<{
  questionnaire: DdQuestionnaireRecord;
  answers: DdAnswerMap;
  questions: AdminDdQuestion[];
  deals: DealRecord[];
}> {
  const supabase = createServiceRoleSupabaseClient();
  const questions = await listPublishedDdQuestions();

  let { data: existing } = await supabase
    .from("dd_questionnaires")
    .select("id, owner_sub, deal_id, tenant_id, status, submitted_at, updated_at")
    .eq("owner_sub", ownerSub)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existing) {
    const { data: created, error } = await supabase
      .from("dd_questionnaires")
      .insert({ owner_sub: ownerSub, status: "draft" })
      .select("id, owner_sub, deal_id, tenant_id, status, submitted_at, updated_at")
      .single();
    if (error) throw error;
    existing = created;
  }

  const { data: answerRows } = await supabase
    .from("dd_questionnaire_answers")
    .select("question_id, value, note")
    .eq("questionnaire_id", existing.id);

  const answers: DdAnswerMap = {};
  for (const row of answerRows ?? []) {
    answers[row.question_id] = { value: row.value, note: row.note ?? "" };
  }

  const deals = await listDealsForParticipant(ownerSub, "target");

  return {
    questionnaire: {
      id: existing.id,
      ownerSub: existing.owner_sub,
      dealId: existing.deal_id,
      tenantId: existing.tenant_id,
      status: existing.status as "draft" | "submitted",
      submittedAt: existing.submitted_at,
      updatedAt: existing.updated_at,
    },
    answers,
    questions,
    deals,
  };
}

export async function saveQuestionnaireAnswers(input: {
  questionnaireId: string;
  dealId?: string | null;
  answers: Array<{ questionId: string; value: string; note?: string }>;
}): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServiceRoleSupabaseClient();
  const { data: q, error: qError } = await supabase
    .from("dd_questionnaires")
    .select("id, owner_sub, status")
    .eq("id", input.questionnaireId)
    .maybeSingle();
  if (qError) throw qError;
  if (!q || q.owner_sub !== userId) throw new Error("Forbidden");
  if (q.status === "submitted") throw new Error("already_submitted");

  let tenantId: string | null = null;
  if (input.dealId) {
    await assertDealReadAccess(input.dealId, userId);
    const { data: deal } = await supabase
      .from("deals")
      .select("tenant_id")
      .eq("id", input.dealId)
      .maybeSingle();
    tenantId = deal?.tenant_id ?? null;
  }

  const { error: updateError } = await supabase
    .from("dd_questionnaires")
    .update({
      deal_id: input.dealId ?? null,
      tenant_id: tenantId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.questionnaireId);
  if (updateError) throw updateError;

  for (const answer of input.answers) {
    const { error } = await supabase.from("dd_questionnaire_answers").upsert(
      {
        questionnaire_id: input.questionnaireId,
        question_id: answer.questionId,
        value: answer.value,
        note: answer.note?.trim() || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "questionnaire_id,question_id" },
    );
    if (error) throw error;
  }
}

export async function submitQuestionnaire(input: {
  questionnaireId: string;
  dealId: string;
  locale: "es" | "en";
}): Promise<{ findingCount: number }> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServiceRoleSupabaseClient();
  const { data: q } = await supabase
    .from("dd_questionnaires")
    .select("id, owner_sub, status")
    .eq("id", input.questionnaireId)
    .maybeSingle();
  if (!q || q.owner_sub !== userId) throw new Error("Forbidden");
  if (q.status === "submitted") throw new Error("already_submitted");

  await assertDealReadAccess(input.dealId, userId);
  const { data: deal } = await supabase
    .from("deals")
    .select("id, tenant_id")
    .eq("id", input.dealId)
    .maybeSingle();
  if (!deal) throw new Error("deal_not_found");

  const questions = await listPublishedDdQuestions();
  const { data: answerRows } = await supabase
    .from("dd_questionnaire_answers")
    .select("question_id, value, note")
    .eq("questionnaire_id", input.questionnaireId);

  const answerMap = new Map(
    (answerRows ?? []).map((row) => [row.question_id, row] as const),
  );

  await supabase
    .from("findings")
    .delete()
    .eq("questionnaire_id", input.questionnaireId)
    .eq("status", "draft");

  let findingCount = 0;
  for (const question of questions) {
    const answer = answerMap.get(question.id);
    const value = answer?.value ?? "";
    if (!isGapAnswer(question, value)) continue;

    const description =
      input.locale === "en" ? question.findingEn : question.findingEs;
    const note = answer?.note?.trim();
    const fullDescription = note
      ? `${description}\n\n(${input.locale === "en" ? "Founder note" : "Nota del fundador"}: ${note})`
      : description;
    const action =
      input.locale === "en" ? question.actionEn : question.actionEs;

    const { error } = await supabase.from("findings").insert({
      deal_id: deal.id,
      tenant_id: deal.tenant_id,
      risk_category: question.riskCategory,
      risk_level: question.riskLevelIfGap,
      description: fullDescription,
      recommended_action: action,
      status: "draft",
      source_question_id: question.id,
      questionnaire_id: input.questionnaireId,
    });
    if (error) throw error;
    findingCount += 1;
  }

  const { error: submitError } = await supabase
    .from("dd_questionnaires")
    .update({
      status: "submitted",
      deal_id: deal.id,
      tenant_id: deal.tenant_id,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", input.questionnaireId);
  if (submitError) throw submitError;

  await writeAuditLog({
    action: "dd.questionnaire.submit",
    actorSub: userId,
    tenantId: deal.tenant_id,
    resourceType: "dd_questionnaire",
    resourceId: input.questionnaireId,
    metadata: { dealId: deal.id, findingCount },
  });

  return { findingCount };
}

export async function reopenQuestionnaire(questionnaireId: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  const supabase = createServiceRoleSupabaseClient();
  const { data: q } = await supabase
    .from("dd_questionnaires")
    .select("id, owner_sub")
    .eq("id", questionnaireId)
    .maybeSingle();
  if (!q || q.owner_sub !== userId) throw new Error("Forbidden");

  await supabase
    .from("findings")
    .delete()
    .eq("questionnaire_id", questionnaireId)
    .eq("status", "draft");

  const { error } = await supabase
    .from("dd_questionnaires")
    .update({
      status: "draft",
      submitted_at: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", questionnaireId);
  if (error) throw error;
}

export async function setFindingReviewStatus(input: {
  findingId: string;
  status: "active" | "dismissed";
}): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const supabase = createServiceRoleSupabaseClient();
  const { data: finding } = await supabase
    .from("findings")
    .select("id, deal_id, tenant_id")
    .eq("id", input.findingId)
    .maybeSingle();
  if (!finding) throw new Error("not_found");

  await assertFirmDealAccess(finding.deal_id);

  const { error } = await supabase
    .from("findings")
    .update({ status: input.status, updated_at: new Date().toISOString() })
    .eq("id", input.findingId);
  if (error) throw error;

  await writeAuditLog({
    action: `dd.finding.${input.status}`,
    actorSub: userId,
    tenantId: finding.tenant_id,
    resourceType: "finding",
    resourceId: finding.id,
  });
}
