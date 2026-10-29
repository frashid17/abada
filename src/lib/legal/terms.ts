import { readFileSync } from "node:fs";
import path from "node:path";
import { headers } from "next/headers";
import { writeAuditLog } from "@/lib/audit";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

/** Bump when legal text changes so users must re-accept. */
export const CURRENT_TERMS_VERSION = "2026-10-23";

export type TermsLocale = "es-CO" | "en-US";

const TERMS_FILES: Record<TermsLocale, string> = {
  "es-CO": "terms-es-CO.html",
  "en-US": "terms-en-US.html",
};

export function getTermsHtml(locale: TermsLocale): string {
  const file = TERMS_FILES[locale] ?? TERMS_FILES["es-CO"];
  const fullPath = path.join(process.cwd(), "content/legal", file);
  return readFileSync(fullPath, "utf8");
}

export async function hasAcceptedCurrentTerms(ownerSub: string): Promise<boolean> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase
      .from("terms_acceptances")
      .select("id")
      .eq("owner_sub", ownerSub)
      .eq("terms_version", CURRENT_TERMS_VERSION)
      .maybeSingle();

    if (error) {
      console.error("[terms] hasAcceptedCurrentTerms", error);
      return false;
    }
    return Boolean(data);
  } catch (error) {
    console.error("[terms] hasAcceptedCurrentTerms", error);
    return false;
  }
}

export async function recordTermsAcceptance(input: {
  ownerSub: string;
  locale: TermsLocale;
  respondentEmail: string;
  respondentName?: string | null;
}): Promise<{ id: string }> {
  const supabase = createServiceRoleSupabaseClient();
  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip =
    (forwarded ? forwarded.split(",")[0]?.trim() : null) ||
    headerStore.get("x-real-ip");
  const userAgent = headerStore.get("user-agent");

  const { data, error } = await supabase
    .from("terms_acceptances")
    .upsert(
      {
        owner_sub: input.ownerSub,
        terms_version: CURRENT_TERMS_VERSION,
        locale: input.locale,
        respondent_email: input.respondentEmail.trim().toLowerCase(),
        respondent_name: input.respondentName?.trim() || null,
        ip_address: ip,
        user_agent: userAgent,
        accepted_at: new Date().toISOString(),
      },
      { onConflict: "owner_sub,terms_version" },
    )
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Failed to record terms acceptance");
  }

  await writeAuditLog({
    action: "legal.terms.accepted",
    actorSub: input.ownerSub,
    resourceType: "terms_acceptance",
    resourceId: data.id,
    metadata: {
      termsVersion: CURRENT_TERMS_VERSION,
      locale: input.locale,
      respondentEmail: input.respondentEmail.trim().toLowerCase(),
    },
  });

  return { id: data.id };
}
