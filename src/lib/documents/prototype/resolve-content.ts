import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";
import type {
  PrototypeContentBundle,
  PrototypeDoc,
  PrototypeDocId,
  PrototypeGlobalsPayload,
} from "@/lib/documents/prototype/types";

const PACK_IDS: PrototypeDocId[] = ["fundadores", "incentivos", "pi"];

function mergeGlobalsAndDocs(
  globals: PrototypeGlobalsPayload,
  docs: Record<PrototypeDocId, PrototypeDoc>,
): PrototypeContentBundle {
  return {
    order: globals.order,
    decisions: globals.decisions,
    tokens: globals.tokens,
    docs,
  };
}

/** Load published CMS content; fall back to code seed on miss or error. */
export async function getResolvedPrototypeContent(): Promise<PrototypeContentBundle> {
  try {
    const supabase = createServiceRoleSupabaseClient();

    const { data: globalsRow } = await supabase
      .from("platform_document_globals")
      .select("published_revision")
      .eq("id", "default")
      .maybeSingle();

    let globals: PrototypeGlobalsPayload | null = null;
    if (globalsRow?.published_revision) {
      const { data: globalRev } = await supabase
        .from("platform_document_global_revisions")
        .select("payload")
        .eq("revision", globalsRow.published_revision)
        .maybeSingle();
      if (globalRev?.payload) {
        globals = globalRev.payload as PrototypeGlobalsPayload;
      }
    }

    const docs = { ...SEED_PROTOTYPE_CONTENT.docs };
    let anyPackPublished = false;

    for (const packId of PACK_IDS) {
      const { data: pack } = await supabase
        .from("platform_document_packs")
        .select("published_revision, status")
        .eq("id", packId)
        .maybeSingle();

      if (!pack?.published_revision) continue;

      const { data: rev } = await supabase
        .from("platform_document_revisions")
        .select("payload")
        .eq("pack_id", packId)
        .eq("revision", pack.published_revision)
        .maybeSingle();

      if (rev?.payload) {
        docs[packId] = rev.payload as PrototypeDoc;
        anyPackPublished = true;
      }
    }

    if (globals || anyPackPublished) {
      return mergeGlobalsAndDocs(
        globals ?? {
          order: SEED_PROTOTYPE_CONTENT.order,
          decisions: SEED_PROTOTYPE_CONTENT.decisions,
          tokens: SEED_PROTOTYPE_CONTENT.tokens,
        },
        docs,
      );
    }
  } catch (error) {
    console.error("[prototype-content] CMS load failed, using seed", error);
  }

  return SEED_PROTOTYPE_CONTENT;
}

/** Admin draft view: merges DB drafts with seed fallbacks. */
export async function getAdminPrototypeDraftContent(): Promise<PrototypeContentBundle> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: globalsRow } = await supabase
    .from("platform_document_globals")
    .select("draft_payload")
    .eq("id", "default")
    .maybeSingle();

  const globalsDraft = globalsRow?.draft_payload as PrototypeGlobalsPayload | undefined;

  const docs = { ...SEED_PROTOTYPE_CONTENT.docs };
  for (const packId of PACK_IDS) {
    const { data: pack } = await supabase
      .from("platform_document_packs")
      .select("draft_payload")
      .eq("id", packId)
      .maybeSingle();
    if (pack?.draft_payload && Object.keys(pack.draft_payload as object).length > 0) {
      docs[packId] = pack.draft_payload as PrototypeDoc;
    }
  }

  return mergeGlobalsAndDocs(
    {
      order: globalsDraft?.order ?? SEED_PROTOTYPE_CONTENT.order,
      decisions: globalsDraft?.decisions ?? SEED_PROTOTYPE_CONTENT.decisions,
      tokens: globalsDraft?.tokens ?? SEED_PROTOTYPE_CONTENT.tokens,
    },
    docs,
  );
}
