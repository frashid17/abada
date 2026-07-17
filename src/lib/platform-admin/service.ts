import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import {
  listLegalSources,
  getLegalSourceFromManifest,
  loadLegalSourceChunks,
} from "@/lib/legal-corpus";
import type { LegalSourceType } from "@/lib/legal-corpus";
import { chunkLegalText } from "@/lib/legal-corpus/chunk-text";
import { extractTextFromPdf, type PdfExtractMethod } from "@/lib/legal-corpus/pdf-extract";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { writeAuditLog } from "@/lib/audit";
import { resolveUserLabels } from "@/lib/platform-admin/user-labels";

export type AdminCorpusSource = {
  id: string;
  sourceType: LegalSourceType;
  citationEs: string;
  citationEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  chunkCount: number;
  founderVisible: boolean;
  status: string;
};

export type UpsertLegalSourceInput = {
  id?: string;
  sourceType: LegalSourceType;
  citationEs: string;
  citationEn: string;
  titleEs: string;
  titleEn: string;
  descriptionEs: string;
  descriptionEn: string;
  founderVisible: boolean;
  /** Spanish body pasted by an admin — article-chunked for AI/founder reading. */
  pastedTextEs?: string;
  /** Optional PDF bytes; text layer first, OCR fallback for scanned pages. */
  pdfBytes?: Buffer;
  pdfFileName?: string;
};

const SOURCE_TYPES: LegalSourceType[] = [
  "constitution",
  "code",
  "statute",
  "decree",
  "circular",
  "decision",
];

export function isLegalSourceType(value: string): value is LegalSourceType {
  return SOURCE_TYPES.includes(value as LegalSourceType);
}

export function slugifySourceId(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listAdminCorpusSources(): Promise<AdminCorpusSource[]> {
  await requirePlatformAdmin();

  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("legal_sources")
      .select(
        "id, source_type, citation_es, citation_en, title_es, title_en, description_es, description_en, chunk_count, founder_visible, status",
      )
      .order("citation_es");

    if (!error && data?.length) {
      return data.map((row) => ({
        id: row.id,
        sourceType: row.source_type as LegalSourceType,
        citationEs: row.citation_es,
        citationEn: row.citation_en,
        titleEs: row.title_es,
        titleEn: row.title_en,
        descriptionEs: row.description_es ?? "",
        descriptionEn: row.description_en ?? "",
        chunkCount: row.chunk_count,
        founderVisible: row.founder_visible ?? true,
        status: row.status,
      }));
    }
  } catch {
    // fall through to local manifest
  }

  return listLegalSources().map((source) => {
    const chunks = loadLegalSourceChunks(source.id, "es-CO");
    return {
      id: source.id,
      sourceType: source.sourceType,
      citationEs: source.citation.es,
      citationEn: source.citation.en,
      titleEs: source.title.es,
      titleEn: source.title.en,
      descriptionEs: source.description.es,
      descriptionEn: source.description.en,
      chunkCount: chunks?.chunkCount ?? 0,
      founderVisible: true,
      status: chunks ? "extracted" : "pending",
    };
  });
}

export async function getAdminCorpusSource(sourceId: string): Promise<AdminCorpusSource | null> {
  const sources = await listAdminCorpusSources();
  return sources.find((s) => s.id === sourceId) ?? null;
}

async function replaceLegalSourceChunks(
  sourceId: string,
  titleEs: string,
  titleEn: string,
  rawText: string,
): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const chunks = chunkLegalText(rawText);
  if (chunks.length === 0) {
    throw new Error("empty_extracted_text");
  }

  const { error: deleteError } = await supabase
    .from("legal_source_chunks")
    .delete()
    .eq("source_id", sourceId);
  if (deleteError) throw deleteError;

  const esRows = chunks.map((chunk, index) => ({
    source_id: sourceId,
    locale: "es-CO" as const,
    chunk_index: index,
    article_ref: chunk.articleRef,
    heading: chunk.heading || titleEs,
    content: chunk.content,
    translation_status: "official" as const,
  }));

  const enRows = chunks.map((chunk, index) => ({
    source_id: sourceId,
    locale: "en-US" as const,
    chunk_index: index,
    article_ref: chunk.articleRef,
    heading: chunk.heading || titleEn || titleEs,
    content: chunk.content,
    translation_status: "pending" as const,
  }));

  const { error: esError } = await supabase.from("legal_source_chunks").insert(esRows);
  if (esError) throw esError;
  const { error: enError } = await supabase.from("legal_source_chunks").insert(enRows);
  if (enError) throw enError;

  return chunks.length;
}

function persistUploadedPdf(sourceId: string, pdfBytes: Buffer, originalName?: string): string {
  const safeName =
    originalName?.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/\.pdf$/i, "") || sourceId;
  const pdfFilename = `${safeName}.pdf`;
  const pdfDir = path.join(process.cwd(), "data", "legal-sources", "pdfs");
  mkdirSync(pdfDir, { recursive: true });
  writeFileSync(path.join(pdfDir, pdfFilename), pdfBytes);
  return pdfFilename;
}

export async function upsertLegalSource(input: UpsertLegalSourceInput): Promise<{
  id: string;
  extractMethod?: PdfExtractMethod;
  chunkCount: number;
}> {
  const adminSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();

  const id =
    input.id?.trim() ||
    slugifySourceId(input.citationEs || input.titleEs) ||
    `law-${Date.now()}`;

  if (!isLegalSourceType(input.sourceType)) {
    throw new Error("Invalid source type");
  }

  const existing = await getAdminCorpusSource(id);
  const isCreate = !existing;

  const pasted = input.pastedTextEs?.trim() ?? "";
  let bodyText = pasted;
  let extractMethod: PdfExtractMethod | undefined;
  let pdfFilename: string | undefined;

  if (input.pdfBytes && input.pdfBytes.length > 0) {
    const extracted = await extractTextFromPdf(input.pdfBytes);
    bodyText = extracted.text;
    extractMethod = extracted.method;
    pdfFilename = persistUploadedPdf(id, input.pdfBytes, input.pdfFileName);
  }

  let chunkCount = existing?.chunkCount ?? 0;
  if (bodyText) {
    // Upsert metadata first so chunk FKs resolve on create
    const { error: preError } = await supabase.from("legal_sources").upsert({
      id,
      source_type: input.sourceType,
      citation_es: input.citationEs.trim(),
      citation_en: input.citationEn.trim() || input.citationEs.trim(),
      title_es: input.titleEs.trim(),
      title_en: input.titleEn.trim() || input.titleEs.trim(),
      description_es: input.descriptionEs.trim() || null,
      description_en: input.descriptionEn.trim() || input.descriptionEs.trim() || null,
      ...(pdfFilename ? { pdf_filename: pdfFilename } : {}),
      chunk_count: 0,
      status: "pending",
      founder_visible: input.founderVisible,
      updated_at: new Date().toISOString(),
    });
    if (preError) throw preError;

    chunkCount = await replaceLegalSourceChunks(
      id,
      input.titleEs.trim(),
      input.titleEn.trim() || input.titleEs.trim(),
      bodyText,
    );
  }

  const { error } = await supabase.from("legal_sources").upsert({
    id,
    source_type: input.sourceType,
    citation_es: input.citationEs.trim(),
    citation_en: input.citationEn.trim() || input.citationEs.trim(),
    title_es: input.titleEs.trim(),
    title_en: input.titleEn.trim() || input.titleEs.trim(),
    description_es: input.descriptionEs.trim() || null,
    description_en: input.descriptionEn.trim() || input.descriptionEs.trim() || null,
    ...(pdfFilename ? { pdf_filename: pdfFilename } : {}),
    chunk_count: chunkCount,
    status: chunkCount > 0 ? "extracted" : "pending",
    founder_visible: input.founderVisible,
    ...(bodyText ? { extracted_at: new Date().toISOString() } : {}),
    updated_at: new Date().toISOString(),
  });

  if (error) throw error;

  await writeAuditLog({
    action: isCreate ? "corpus.source_created" : "corpus.source_updated",
    actorSub: adminSub,
    resourceType: "legal_source",
    resourceId: id,
    metadata: {
      titleEs: input.titleEs,
      founderVisible: input.founderVisible,
      pasted: Boolean(pasted) && !input.pdfBytes,
      pdf: Boolean(input.pdfBytes),
      extractMethod: extractMethod ?? null,
      chunkCount,
    },
  });

  return { id, extractMethod, chunkCount };
}

export async function setCorpusFounderVisibility(
  sourceId: string,
  founderVisible: boolean,
): Promise<void> {
  const adminSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();

  const { error } = await supabase
    .from("legal_sources")
    .update({ founder_visible: founderVisible, updated_at: new Date().toISOString() })
    .eq("id", sourceId);

  if (error) {
    const source = getLegalSourceFromManifest(sourceId);
    if (!source) throw error;

    const chunks = loadLegalSourceChunks(sourceId, "es-CO");
    const { error: upsertError } = await supabase.from("legal_sources").upsert({
      id: source.id,
      corpus_id: source.corpusId,
      source_type: source.sourceType,
      citation_es: source.citation.es,
      citation_en: source.citation.en,
      title_es: source.title.es,
      title_en: source.title.en,
      description_es: source.description.es,
      description_en: source.description.en,
      pdf_filename: source.pdfFilename,
      chunk_count: chunks?.chunkCount ?? 0,
      status: chunks ? "extracted" : "pending",
      founder_visible: founderVisible,
      updated_at: new Date().toISOString(),
    });
    if (upsertError) throw upsertError;
  }

  await writeAuditLog({
    action: founderVisible ? "corpus.published_to_founders" : "corpus.hidden_from_founders",
    actorSub: adminSub,
    resourceType: "legal_source",
    resourceId: sourceId,
    metadata: { founderVisible },
  });
}

export type AdminAiUsageRow = {
  id: string;
  callerSub: string;
  callerName: string;
  callerEmail: string | null;
  task: string;
  model: string;
  tenantId: string | null;
  createdAt: string;
};

export async function listAdminAiUsage(limit = 50): Promise<AdminAiUsageRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("ai_call_logs")
    .select("id, caller_sub, task, model, tenant_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const labels = await resolveUserLabels((data ?? []).map((row) => row.caller_sub));

  return (data ?? []).map((row) => {
    const label = labels.get(row.caller_sub);
    return {
      id: row.id,
      callerSub: row.caller_sub,
      callerName: label?.displayName ?? row.caller_sub,
      callerEmail: label?.email ?? null,
      task: row.task,
      model: row.model,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
    };
  });
}

export type AdminReviewRow = {
  id: string;
  status: string;
  requesterSub: string;
  requesterName: string;
  requesterEmail: string | null;
  documentId: string;
  tenantId: string;
  createdAt: string;
};

export async function listAdminReviews(limit = 40): Promise<AdminReviewRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("reviews")
    .select("id, status, requester_sub, document_id, tenant_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const labels = await resolveUserLabels((data ?? []).map((row) => row.requester_sub));

  return (data ?? []).map((row) => {
    const label = labels.get(row.requester_sub);
    return {
      id: row.id,
      status: row.status,
      requesterSub: row.requester_sub,
      requesterName: label?.displayName ?? row.requester_sub,
      requesterEmail: label?.email ?? null,
      documentId: row.document_id,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
    };
  });
}

export type AdminAuditRow = {
  id: string;
  action: string;
  actorSub: string | null;
  actorName: string;
  actorEmail: string | null;
  resourceType: string;
  resourceId: string | null;
  tenantId: string | null;
  createdAt: string;
};

export async function listAdminAuditLogs(limit = 50): Promise<AdminAuditRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("id, action, actor_sub, resource_type, resource_id, tenant_id, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;

  const labels = await resolveUserLabels((data ?? []).map((row) => row.actor_sub));

  return (data ?? []).map((row) => {
    const label = row.actor_sub ? labels.get(row.actor_sub) : undefined;
    return {
      id: row.id,
      action: row.action,
      actorSub: row.actor_sub,
      actorName: label?.displayName ?? (row.actor_sub ? row.actor_sub : "—"),
      actorEmail: label?.email ?? null,
      resourceType: row.resource_type,
      resourceId: row.resource_id,
      tenantId: row.tenant_id,
      createdAt: row.created_at,
    };
  });
}

export async function getAdminOverviewCounts(): Promise<{
  corpusSources: number;
  visibleSources: number;
  aiCalls: number;
  openReviews: number;
  auditEvents: number;
}> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();

  const [corpus, visible, ai, reviews, audit] = await Promise.all([
    supabase.from("legal_sources").select("id", { count: "exact", head: true }),
    supabase
      .from("legal_sources")
      .select("id", { count: "exact", head: true })
      .eq("founder_visible", true),
    supabase.from("ai_call_logs").select("id", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("status", ["queued", "in_progress"]),
    supabase.from("audit_logs").select("id", { count: "exact", head: true }),
  ]);

  const localCorpus = listLegalSources().length;

  return {
    corpusSources: corpus.count && corpus.count > 0 ? corpus.count : localCorpus,
    visibleSources: visible.count ?? localCorpus,
    aiCalls: ai.count ?? 0,
    openReviews: reviews.count ?? 0,
    auditEvents: audit.count ?? 0,
  };
}

export async function getAdminDashboardFeed(): Promise<{
  recentAudit: AdminAuditRow[];
  recentAi: AdminAiUsageRow[];
  openReviews: AdminReviewRow[];
}> {
  const [recentAudit, recentAi, openReviews] = await Promise.all([
    listAdminAuditLogs(6),
    listAdminAiUsage(5),
    listAdminReviews(5),
  ]);

  return {
    recentAudit,
    recentAi,
    openReviews: openReviews.filter((r) => r.status === "queued" || r.status === "in_progress"),
  };
}
