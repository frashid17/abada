import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";
import type {
  PrototypeArticle,
  PrototypeDecision,
  PrototypeDoc,
  PrototypeDocId,
  PrototypeTokenMeta,
} from "@/lib/documents/prototype/types";

const PACK_IDS: PrototypeDocId[] = ["fundadores", "incentivos", "pi"];

export type AdminDocumentPackSummary = {
  id: PrototypeDocId;
  titleEs: string;
  titleEn: string;
  status: "draft" | "published";
  publishedRevision: number | null;
  articleCount: number;
  updatedAt: string | null;
};

export type AdminGlobalsDraft = {
  order: PrototypeDocId[];
  decisions: Record<string, PrototypeDecision>;
  tokens: Record<string, PrototypeTokenMeta>;
};

async function ensurePackRows(): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  for (const id of PACK_IDS) {
    const seed = SEED_PROTOTYPE_CONTENT.docs[id];
    await supabase.from("platform_document_packs").upsert(
      {
        id,
        title_es: seed.t_es,
        title_en: seed.t_en,
        draft_payload: seed,
        status: "draft",
      },
      { onConflict: "id", ignoreDuplicates: true },
    );
  }
  await supabase.from("platform_document_globals").upsert(
    {
      id: "default",
      draft_payload: {
        order: SEED_PROTOTYPE_CONTENT.order,
        decisions: SEED_PROTOTYPE_CONTENT.decisions,
        tokens: SEED_PROTOTYPE_CONTENT.tokens,
      },
    },
    { onConflict: "id", ignoreDuplicates: true },
  );
}

export async function listAdminDocumentPacks(): Promise<AdminDocumentPackSummary[]> {
  await requirePlatformAdmin();
  await ensurePackRows();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_document_packs")
    .select("id, title_es, title_en, status, published_revision, draft_payload, updated_at")
    .in("id", PACK_IDS)
    .order("id");
  if (error) throw error;

  return (data ?? []).map((row) => {
    const draft = row.draft_payload as PrototypeDoc;
    const articleCount = draft?.groups?.flatMap((g) => g.arts).length ?? 0;
    return {
      id: row.id as PrototypeDocId,
      titleEs: row.title_es,
      titleEn: row.title_en,
      status: row.status as "draft" | "published",
      publishedRevision: row.published_revision,
      articleCount,
      updatedAt: row.updated_at,
    };
  });
}

export async function getAdminPackDraft(packId: PrototypeDocId): Promise<PrototypeDoc> {
  await requirePlatformAdmin();
  await ensurePackRows();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_document_packs")
    .select("draft_payload")
    .eq("id", packId)
    .single();
  if (error) throw error;
  const draft = data.draft_payload as PrototypeDoc;
  if (draft?.groups?.length) return draft;
  return SEED_PROTOTYPE_CONTENT.docs[packId];
}

export async function getAdminGlobalsDraft(): Promise<AdminGlobalsDraft> {
  await requirePlatformAdmin();
  await ensurePackRows();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_document_globals")
    .select("draft_payload")
    .eq("id", "default")
    .single();
  if (error) throw error;
  const draft = data.draft_payload as AdminGlobalsDraft;
  return {
    order: draft?.order ?? SEED_PROTOTYPE_CONTENT.order,
    decisions: draft?.decisions ?? SEED_PROTOTYPE_CONTENT.decisions,
    tokens: draft?.tokens ?? SEED_PROTOTYPE_CONTENT.tokens,
  };
}

export async function saveAdminArticle(
  packId: PrototypeDocId,
  articleId: string,
  patch: Partial<PrototypeArticle>,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  const doc = await getAdminPackDraft(packId);
  let found = false;
  const groups = doc.groups.map((group) => ({
    ...group,
    arts: group.arts.map((article) => {
      if (article.id !== articleId) return article;
      found = true;
      return { ...article, ...patch };
    }),
  }));
  if (!found) throw new Error("Article not found");

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_document_packs")
    .update({
      draft_payload: { ...doc, groups },
      status: "draft",
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packId);
  if (error) throw error;

  await writeAuditLog({
    action: "platform.document.article_updated",
    actorSub,
    resourceType: "platform_document_pack",
    resourceId: `${packId}/${articleId}`,
  });
}

export async function saveAdminGlobalsDraft(globals: AdminGlobalsDraft): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_document_globals")
    .update({
      draft_payload: globals,
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (error) throw error;

  await writeAuditLog({
    action: "platform.document.globals_updated",
    actorSub,
    resourceType: "platform_document_globals",
    resourceId: "default",
  });
}

export async function saveAdminDecision(
  key: string,
  decision: PrototypeDecision,
): Promise<void> {
  const globals = await getAdminGlobalsDraft();
  globals.decisions[key] = decision;
  await saveAdminGlobalsDraft(globals);
}

export async function saveAdminToken(
  key: string,
  token: PrototypeTokenMeta,
): Promise<void> {
  const globals = await getAdminGlobalsDraft();
  globals.tokens[key] = token;
  await saveAdminGlobalsDraft(globals);
}

export async function publishAdminPack(
  packId: PrototypeDocId,
  note?: string,
): Promise<number> {
  const actorSub = await requirePlatformAdmin();
  const doc = await getAdminPackDraft(packId);
  const supabase = createServiceRoleSupabaseClient();

  const { data: pack } = await supabase
    .from("platform_document_packs")
    .select("published_revision")
    .eq("id", packId)
    .single();

  const nextRevision = (pack?.published_revision ?? 0) + 1;

  const { error: revError } = await supabase.from("platform_document_revisions").insert({
    pack_id: packId,
    revision: nextRevision,
    payload: doc,
    published_by: actorSub,
    note: note ?? null,
  });
  if (revError) throw revError;

  const { error: packError } = await supabase
    .from("platform_document_packs")
    .update({
      status: "published",
      published_revision: nextRevision,
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("id", packId);
  if (packError) throw packError;

  await writeAuditLog({
    action: "platform.document.pack_published",
    actorSub,
    resourceType: "platform_document_pack",
    resourceId: packId,
    metadata: { revision: nextRevision },
  });

  return nextRevision;
}

export async function publishAdminGlobals(note?: string): Promise<number> {
  const actorSub = await requirePlatformAdmin();
  const globals = await getAdminGlobalsDraft();
  const supabase = createServiceRoleSupabaseClient();

  const { data: row } = await supabase
    .from("platform_document_globals")
    .select("published_revision")
    .eq("id", "default")
    .single();

  const nextRevision = (row?.published_revision ?? 0) + 1;

  const { error: revError } = await supabase.from("platform_document_global_revisions").insert({
    revision: nextRevision,
    payload: globals,
    published_by: actorSub,
    note: note ?? null,
  });
  if (revError) throw revError;

  const { error: globalError } = await supabase
    .from("platform_document_globals")
    .update({
      published_revision: nextRevision,
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");
  if (globalError) throw globalError;

  await writeAuditLog({
    action: "platform.document.globals_published",
    actorSub,
    resourceType: "platform_document_globals",
    resourceId: "default",
    metadata: { revision: nextRevision },
  });

  return nextRevision;
}

export async function importDocumentSeedFromCode(actorSub?: string): Promise<void> {
  const sub = actorSub ?? (await requirePlatformAdmin());
  await ensurePackRows();
  const supabase = createServiceRoleSupabaseClient();

  for (const id of PACK_IDS) {
    const seed = SEED_PROTOTYPE_CONTENT.docs[id];
    await supabase
      .from("platform_document_packs")
      .update({
        title_es: seed.t_es,
        title_en: seed.t_en,
        draft_payload: seed,
        status: "draft",
        updated_by: sub,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }

  await supabase
    .from("platform_document_globals")
    .update({
      draft_payload: {
        order: SEED_PROTOTYPE_CONTENT.order,
        decisions: SEED_PROTOTYPE_CONTENT.decisions,
        tokens: SEED_PROTOTYPE_CONTENT.tokens,
      },
      updated_by: sub,
      updated_at: new Date().toISOString(),
    })
    .eq("id", "default");

  await writeAuditLog({
    action: "platform.document.seed_imported",
    actorSub: sub,
    resourceType: "platform_document_globals",
    resourceId: "default",
  });
}

export function findArticleInDoc(
  doc: PrototypeDoc,
  articleId: string,
): { article: PrototypeArticle; groupIndex: number; articleIndex: number } | null {
  for (let gi = 0; gi < doc.groups.length; gi++) {
    const group = doc.groups[gi]!;
    for (let ai = 0; ai < group.arts.length; ai++) {
      if (group.arts[ai]!.id === articleId) {
        return { article: group.arts[ai]!, groupIndex: gi, articleIndex: ai };
      }
    }
  }
  return null;
}
