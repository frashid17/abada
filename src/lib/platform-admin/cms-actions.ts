"use server";

import { revalidatePath } from "next/cache";
import type { PrototypeArticle, PrototypeDecision, PrototypeDocId, PrototypeTokenMeta } from "@/lib/documents/prototype/types";
import type { AdminGlobalsDraft } from "@/lib/platform-admin/document-cms";
import {
  importDocumentSeedFromCode,
  publishAdminGlobals,
  publishAdminPack,
  saveAdminArticle,
  saveAdminDecision,
  saveAdminGlobalsDraft,
  saveAdminToken,
} from "@/lib/platform-admin/document-cms";
import {
  importTemplateSeedFromCode,
  publishAdminTemplate,
  saveAdminTemplateDraft,
  type TemplateLocale,
  type TemplateSlug,
} from "@/lib/platform-admin/template-cms";
import {
  addPlatformAdmin,
  deleteKnowledgeArticle,
  removePlatformAdmin,
  setFeatureFlagOverride,
  setUserContext,
  setUserPlatformAdmin,
  upsertKnowledgeArticle,
} from "@/lib/platform-admin/ops-cms";
import type { FeatureFlag } from "@/lib/feature-flags";
import type { UserContext } from "@/types/database";
import {
  deleteFirmClause,
  deleteFirmTemplate,
  upsertFirmClause,
  upsertFirmTemplate,
} from "@/lib/firm/template-cms";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function importDocumentSeedAction(): Promise<ActionResult> {
  try {
    await importDocumentSeedFromCode();
    revalidatePath("/admin/documentos");
    revalidatePath("/fundador/documentos");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function publishDocumentPackAction(packId: PrototypeDocId): Promise<ActionResult> {
  try {
    await publishAdminPack(packId);
    await publishAdminGlobals();
    revalidatePath("/admin/documentos");
    revalidatePath(`/admin/documentos/${packId}`);
    revalidatePath("/fundador/documentos");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function saveArticleAction(
  packId: PrototypeDocId,
  articleId: string,
  patch: Partial<PrototypeArticle>,
): Promise<ActionResult> {
  try {
    await saveAdminArticle(packId, articleId, patch);
    revalidatePath(`/admin/documentos/${packId}/${articleId}`);
    revalidatePath(`/admin/documentos/${packId}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function saveGlobalsAction(globals: AdminGlobalsDraft): Promise<ActionResult> {
  try {
    await saveAdminGlobalsDraft(globals);
    revalidatePath("/admin/documentos/globals");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function saveDecisionAction(
  key: string,
  decision: PrototypeDecision,
): Promise<ActionResult> {
  try {
    await saveAdminDecision(key, decision);
    revalidatePath("/admin/documentos/globals");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function saveTokenAction(key: string, token: PrototypeTokenMeta): Promise<ActionResult> {
  try {
    await saveAdminToken(key, token);
    revalidatePath("/admin/documentos/globals");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function importTemplateSeedAction(): Promise<ActionResult> {
  try {
    await importTemplateSeedFromCode();
    revalidatePath("/admin/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function saveTemplateDraftAction(
  slug: TemplateSlug,
  locale: TemplateLocale,
  body: string,
): Promise<ActionResult> {
  try {
    await saveAdminTemplateDraft(slug, locale, body);
    revalidatePath(`/admin/plantillas/${slug}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function publishTemplateAction(
  slug: TemplateSlug,
  locale: TemplateLocale,
): Promise<ActionResult> {
  try {
    await publishAdminTemplate(slug, locale);
    revalidatePath(`/admin/plantillas/${slug}`);
    revalidatePath("/admin/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function addPlatformAdminAction(
  email: string,
  displayName?: string,
): Promise<ActionResult> {
  try {
    await addPlatformAdmin(email, displayName);
    revalidatePath("/admin/equipo");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function removePlatformAdminAction(clerkUserId: string): Promise<ActionResult> {
  try {
    await removePlatformAdmin(clerkUserId);
    revalidatePath("/admin/equipo");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function setUserPlatformAdminAction(
  clerkUserId: string,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    await setUserPlatformAdmin(clerkUserId, enabled);
    revalidatePath("/admin/equipo");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function setUserContextAction(
  clerkUserId: string,
  context: UserContext,
): Promise<ActionResult> {
  try {
    await setUserContext(clerkUserId, context);
    revalidatePath("/admin/equipo");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function setFeatureFlagAction(
  flagKey: FeatureFlag,
  enabled: boolean,
): Promise<ActionResult> {
  try {
    await setFeatureFlagOverride(flagKey, enabled);
    revalidatePath("/admin/flags");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function upsertKnowledgeArticleAction(formData: FormData): Promise<ActionResult> {
  try {
    await upsertKnowledgeArticle({
      id: String(formData.get("id") ?? "").trim() || undefined,
      tenantId: String(formData.get("tenantId") ?? "").trim(),
      slug: String(formData.get("slug") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      excerpt: String(formData.get("excerpt") ?? "").trim() || undefined,
      body: String(formData.get("body") ?? ""),
      status: String(formData.get("status") ?? "draft") as "draft" | "published" | "archived",
    });
    revalidatePath("/admin/conocimiento");
    revalidatePath("/conocimiento");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function deleteKnowledgeArticleAction(id: string): Promise<ActionResult> {
  try {
    await deleteKnowledgeArticle(id);
    revalidatePath("/admin/conocimiento");
    revalidatePath("/conocimiento");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function upsertFirmTemplateAction(formData: FormData): Promise<ActionResult> {
  try {
    await upsertFirmTemplate({
      id: String(formData.get("id") ?? "").trim() || undefined,
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      body: String(formData.get("body") ?? ""),
    });
    revalidatePath("/firma/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function deleteFirmTemplateAction(id: string): Promise<ActionResult> {
  try {
    await deleteFirmTemplate(id);
    revalidatePath("/firma/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function upsertFirmClauseAction(formData: FormData): Promise<ActionResult> {
  try {
    await upsertFirmClause({
      id: String(formData.get("id") ?? "").trim() || undefined,
      slug: String(formData.get("slug") ?? "").trim(),
      name: String(formData.get("name") ?? "").trim(),
      body: String(formData.get("body") ?? ""),
      notes: String(formData.get("notes") ?? "").trim() || undefined,
    });
    revalidatePath("/firma/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function deleteFirmClauseAction(id: string): Promise<ActionResult> {
  try {
    await deleteFirmClause(id);
    revalidatePath("/firma/plantillas");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Failed" };
  }
}
