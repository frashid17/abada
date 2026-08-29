import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { INVESTMENT_DOCUMENT_TYPES } from "@/lib/documents/catalog";
import { ndaMasterTemplate } from "@/lib/documents/templates/nda";
import { ndaMasterTemplateEn } from "@/lib/documents/templates/nda.en";
import { vestingMasterTemplate } from "@/lib/documents/templates/vesting";
import { vestingMasterTemplateEn } from "@/lib/documents/templates/vesting.en";
import { ipMasterTemplate } from "@/lib/documents/templates/ip";
import { ipMasterTemplateEn } from "@/lib/documents/templates/ip.en";
import { employmentMasterTemplate } from "@/lib/documents/templates/employment";
import { employmentMasterTemplateEn } from "@/lib/documents/templates/employment.en";
import { shareholdersMasterTemplate } from "@/lib/documents/templates/shareholders";
import { shareholdersMasterTemplateEn } from "@/lib/documents/templates/shareholders.en";

export type TemplateLocale = "es" | "en";
export type TemplateSlug = (typeof INVESTMENT_DOCUMENT_TYPES)[number];

const SEED_BODIES: Record<TemplateSlug, Record<TemplateLocale, string>> = {
  nda: { es: ndaMasterTemplate, en: ndaMasterTemplateEn },
  vesting: { es: vestingMasterTemplate, en: vestingMasterTemplateEn },
  ip: { es: ipMasterTemplate, en: ipMasterTemplateEn },
  employment: { es: employmentMasterTemplate, en: employmentMasterTemplateEn },
  shareholders: { es: shareholdersMasterTemplate, en: shareholdersMasterTemplateEn },
};

const TEMPLATE_NAMES: Record<TemplateSlug, { es: string; en: string }> = {
  nda: { es: "Acuerdo de confidencialidad", en: "Non-disclosure agreement" },
  vesting: { es: "Acuerdo de vesting", en: "Vesting agreement" },
  ip: { es: "Cesión de propiedad intelectual", en: "IP assignment" },
  employment: { es: "Contrato de trabajo", en: "Employment agreement" },
  shareholders: { es: "Acuerdo de accionistas", en: "Shareholders agreement" },
};

export type AdminTemplateSummary = {
  slug: TemplateSlug;
  locale: TemplateLocale;
  name: string;
  status: "draft" | "published";
  publishedRevision: number | null;
  updatedAt: string | null;
};

function documentLocaleToTemplateLocale(locale: "es-CO" | "en-US"): TemplateLocale {
  return locale === "en-US" ? "en" : "es";
}

export function templateLocaleToDocumentLocale(locale: TemplateLocale): "es-CO" | "en-US" {
  return locale === "en" ? "en-US" : "es-CO";
}

export async function ensureTemplateRows(): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();
  for (const slug of INVESTMENT_DOCUMENT_TYPES) {
    for (const locale of ["es", "en"] as const) {
      await supabase.from("platform_templates").upsert(
        {
          slug,
          locale,
          name: TEMPLATE_NAMES[slug][locale],
          draft_body: SEED_BODIES[slug][locale],
          status: "draft",
        },
        { onConflict: "slug,locale", ignoreDuplicates: true },
      );
    }
  }
}

export async function listAdminTemplates(): Promise<AdminTemplateSummary[]> {
  await requirePlatformAdmin();
  await ensureTemplateRows();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_templates")
    .select("slug, locale, name, status, published_revision, updated_at")
    .order("slug")
    .order("locale");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    slug: row.slug as TemplateSlug,
    locale: row.locale as TemplateLocale,
    name: row.name,
    status: row.status as "draft" | "published",
    publishedRevision: row.published_revision,
    updatedAt: row.updated_at,
  }));
}

export async function getAdminTemplateDraft(
  slug: TemplateSlug,
  locale: TemplateLocale,
): Promise<string> {
  await requirePlatformAdmin();
  await ensureTemplateRows();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_templates")
    .select("draft_body")
    .eq("slug", slug)
    .eq("locale", locale)
    .single();
  if (error) throw error;
  return data.draft_body || SEED_BODIES[slug][locale];
}

export async function saveAdminTemplateDraft(
  slug: TemplateSlug,
  locale: TemplateLocale,
  body: string,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  await ensureTemplateRows();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_templates")
    .update({
      draft_body: body,
      status: "draft",
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .eq("locale", locale);
  if (error) throw error;

  await writeAuditLog({
    action: "platform.template.draft_updated",
    actorSub,
    resourceType: "platform_template",
    resourceId: `${slug}/${locale}`,
  });
}

export async function publishAdminTemplate(
  slug: TemplateSlug,
  locale: TemplateLocale,
  note?: string,
): Promise<number> {
  const actorSub = await requirePlatformAdmin();
  const body = await getAdminTemplateDraft(slug, locale);
  const supabase = createServiceRoleSupabaseClient();

  const { data: row } = await supabase
    .from("platform_templates")
    .select("published_revision")
    .eq("slug", slug)
    .eq("locale", locale)
    .single();

  const nextRevision = (row?.published_revision ?? 0) + 1;

  const { error: revError } = await supabase.from("platform_template_revisions").insert({
    slug,
    locale,
    revision: nextRevision,
    body,
    published_by: actorSub,
    note: note ?? null,
  });
  if (revError) throw revError;

  const { error } = await supabase
    .from("platform_templates")
    .update({
      status: "published",
      published_revision: nextRevision,
      updated_by: actorSub,
      updated_at: new Date().toISOString(),
    })
    .eq("slug", slug)
    .eq("locale", locale);
  if (error) throw error;

  await writeAuditLog({
    action: "platform.template.published",
    actorSub,
    resourceType: "platform_template",
    resourceId: `${slug}/${locale}`,
    metadata: { revision: nextRevision },
  });

  return nextRevision;
}

export async function importTemplateSeedFromCode(actorSub?: string): Promise<void> {
  const sub = actorSub ?? (await requirePlatformAdmin());
  await ensureTemplateRows();
  const supabase = createServiceRoleSupabaseClient();

  for (const slug of INVESTMENT_DOCUMENT_TYPES) {
    for (const locale of ["es", "en"] as const) {
      await supabase
        .from("platform_templates")
        .update({
          name: TEMPLATE_NAMES[slug][locale],
          draft_body: SEED_BODIES[slug][locale],
          status: "draft",
          updated_by: sub,
          updated_at: new Date().toISOString(),
        })
        .eq("slug", slug)
        .eq("locale", locale);
    }
  }

  await writeAuditLog({
    action: "platform.template.seed_imported",
    actorSub: sub,
    resourceType: "platform_template",
    resourceId: "all",
  });
}

/** Published platform template body; falls back to code seed. */
export async function getPublishedMasterTemplateBody(
  slug: TemplateSlug,
  documentLocale: "es-CO" | "en-US",
): Promise<string> {
  const locale = documentLocaleToTemplateLocale(documentLocale);
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data: row } = await supabase
      .from("platform_templates")
      .select("published_revision")
      .eq("slug", slug)
      .eq("locale", locale)
      .maybeSingle();

    if (row?.published_revision) {
      const { data: rev } = await supabase
        .from("platform_template_revisions")
        .select("body")
        .eq("slug", slug)
        .eq("locale", locale)
        .eq("revision", row.published_revision)
        .maybeSingle();
      if (rev?.body) return rev.body;
    }
  } catch (error) {
    console.error("[template-cms] load failed, using seed", error);
  }
  return SEED_BODIES[slug][locale];
}

export { SEED_BODIES };
