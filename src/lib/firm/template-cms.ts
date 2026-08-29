import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requireFirmAdmin } from "@/lib/firm/membership";
import {
  getPublishedMasterTemplateBody,
  type TemplateLocale,
  type TemplateSlug,
  templateLocaleToDocumentLocale,
} from "@/lib/platform-admin/template-cms";
import type { InvestmentDocumentType } from "@/lib/documents/catalog";

export type FirmTemplateRow = {
  id: string;
  slug: string;
  name: string;
  body: string;
  updatedAt: string;
};

export type FirmClauseRow = {
  id: string;
  slug: string;
  name: string;
  body: string;
  variants: unknown[];
  notes: string | null;
  updatedAt: string;
};

async function requireFirmTenantId(): Promise<string> {
  const { tenantId } = await requireFirmAdmin();
  if (!tenantId) throw new Error("No firm tenant");
  return tenantId;
}

export async function listFirmTemplates(): Promise<FirmTemplateRow[]> {
  const tenantId = await requireFirmTenantId();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("firm_templates")
    .select("id, slug, name, body, updated_at")
    .eq("tenant_id", tenantId)
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    body: row.body,
    updatedAt: row.updated_at,
  }));
}

export async function getFirmTemplate(slug: string): Promise<FirmTemplateRow | null> {
  const tenantId = await requireFirmTenantId();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("firm_templates")
    .select("id, slug, name, body, updated_at")
    .eq("tenant_id", tenantId)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    body: data.body,
    updatedAt: data.updated_at,
  };
}

export async function upsertFirmTemplate(input: {
  id?: string;
  slug: string;
  name: string;
  body: string;
}): Promise<void> {
  const { tenantId, userId } = await requireFirmAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const payload = {
    tenant_id: tenantId,
    slug: input.slug.trim(),
    name: input.name.trim(),
    body: input.body,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("firm_templates").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("firm_templates").upsert(payload, {
      onConflict: "tenant_id,slug",
    });
    if (error) throw error;
  }

  await writeAuditLog({
    action: "firm.template.upserted",
    actorSub: userId,
    tenantId,
    resourceType: "firm_template",
    resourceId: input.slug,
  });
}

export async function deleteFirmTemplate(id: string): Promise<void> {
  const { tenantId, userId } = await requireFirmAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("firm_templates").delete().eq("id", id);
  if (error) throw error;
  await writeAuditLog({
    action: "firm.template.deleted",
    actorSub: userId,
    tenantId,
    resourceType: "firm_template",
    resourceId: id,
  });
}

export async function deleteFirmClause(id: string): Promise<void> {
  const { tenantId, userId } = await requireFirmAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("clauses").delete().eq("id", id);
  if (error) throw error;
  await writeAuditLog({
    action: "firm.clause.deleted",
    actorSub: userId,
    tenantId,
    resourceType: "clause",
    resourceId: id,
  });
}

export async function listFirmClauses(): Promise<FirmClauseRow[]> {
  const tenantId = await requireFirmTenantId();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("clauses")
    .select("id, slug, name, body, variants, notes, updated_at")
    .eq("tenant_id", tenantId)
    .order("slug");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    body: row.body,
    variants: (row.variants as unknown[]) ?? [],
    notes: row.notes,
    updatedAt: row.updated_at,
  }));
}

export async function upsertFirmClause(input: {
  id?: string;
  slug: string;
  name: string;
  body: string;
  notes?: string;
}): Promise<void> {
  const { tenantId, userId } = await requireFirmAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const payload = {
    tenant_id: tenantId,
    slug: input.slug.trim(),
    name: input.name.trim(),
    body: input.body,
    notes: input.notes?.trim() || null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("clauses").update(payload).eq("id", input.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("clauses").upsert(payload, {
      onConflict: "tenant_id,slug",
    });
    if (error) throw error;
  }

  await writeAuditLog({
    action: "firm.clause.upserted",
    actorSub: userId,
    tenantId,
    resourceType: "clause",
    resourceId: input.slug,
  });
}

/** Resolution: firm override → platform published → code seed. */
export async function resolveMasterTemplateBody(
  documentType: InvestmentDocumentType,
  locale: "es-CO" | "en-US",
  tenantId?: string | null,
): Promise<string> {
  const slug = documentType as TemplateSlug;
  const templateLocale: TemplateLocale = locale === "en-US" ? "en" : "es";

  if (tenantId) {
    try {
      const supabase = createServiceRoleSupabaseClient();
      const { data } = await supabase
        .from("firm_templates")
        .select("body")
        .eq("tenant_id", tenantId)
        .eq("slug", slug)
        .maybeSingle();
      if (data?.body?.trim()) return data.body;
    } catch (error) {
      console.error("[firm-template] override load failed", error);
    }
  }

  return getPublishedMasterTemplateBody(slug, templateLocaleToDocumentLocale(templateLocale));
}
