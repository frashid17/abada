"use server";

import { revalidatePath } from "next/cache";
import {
  deleteAdminDdQuestion,
  seedDdQuestionsFromCode,
  setDdQuestionStatus,
  upsertAdminDdQuestion,
} from "@/lib/dd/questionnaire-cms";
import {
  reopenQuestionnaire,
  saveQuestionnaireAnswers,
  setFindingReviewStatus,
  submitQuestionnaire,
} from "@/lib/dd/questionnaire";
import type { DdQuestionAnswerType, DdQuestionSection } from "@/lib/dd/questionnaire-seed";

export async function seedDdQuestionsAction() {
  const result = await seedDdQuestionsFromCode();
  revalidatePath("/admin/diligencia");
  return result;
}

export async function upsertDdQuestionAction(formData: FormData) {
  const id = String(formData.get("id") ?? "").trim() || undefined;
  await upsertAdminDdQuestion({
    id,
    slug: String(formData.get("slug") ?? ""),
    sectionKey: String(formData.get("sectionKey") ?? "declaration") as DdQuestionSection,
    sortOrder: Number(formData.get("sortOrder") ?? 0),
    qEs: String(formData.get("qEs") ?? ""),
    qEn: String(formData.get("qEn") ?? ""),
    hintEs: String(formData.get("hintEs") ?? ""),
    hintEn: String(formData.get("hintEn") ?? ""),
    answerType: String(formData.get("answerType") ?? "yes_no") as DdQuestionAnswerType,
    riskCategory: String(formData.get("riskCategory") ?? "corporativo_registral"),
    riskLevelIfGap: String(formData.get("riskLevelIfGap") ?? "info_requerida"),
    findingEs: String(formData.get("findingEs") ?? ""),
    findingEn: String(formData.get("findingEn") ?? ""),
    actionEs: String(formData.get("actionEs") ?? ""),
    actionEn: String(formData.get("actionEn") ?? ""),
    status: String(formData.get("status") ?? "draft") === "published" ? "published" : "draft",
  });
  revalidatePath("/admin/diligencia");
  revalidatePath("/fundador/diligencia");
}

export async function setDdQuestionStatusAction(id: string, status: "draft" | "published") {
  await setDdQuestionStatus(id, status);
  revalidatePath("/admin/diligencia");
  revalidatePath("/fundador/diligencia");
}

export async function deleteDdQuestionAction(id: string) {
  await deleteAdminDdQuestion(id);
  revalidatePath("/admin/diligencia");
  revalidatePath("/fundador/diligencia");
}

export async function saveDdQuestionnaireAction(input: {
  questionnaireId: string;
  dealId?: string | null;
  answers: Array<{ questionId: string; value: string; note?: string }>;
}) {
  await saveQuestionnaireAnswers(input);
  revalidatePath("/fundador/diligencia");
}

export async function submitDdQuestionnaireAction(input: {
  questionnaireId: string;
  dealId: string;
  locale: "es" | "en";
}) {
  const result = await submitQuestionnaire(input);
  revalidatePath("/fundador/diligencia");
  revalidatePath(`/firma/dd/${input.dealId}`);
  revalidatePath(`/fundador/sala/${input.dealId}`);
  return result;
}

export async function reopenDdQuestionnaireAction(questionnaireId: string) {
  await reopenQuestionnaire(questionnaireId);
  revalidatePath("/fundador/diligencia");
}

export async function reviewFindingAction(findingId: string, status: "active" | "dismissed") {
  await setFindingReviewStatus({ findingId, status });
  revalidatePath("/firma/dd");
}
