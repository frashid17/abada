import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export async function createFirmTenant(input: {
  clerkUserId: string;
  email: string;
  firmName: string;
  displayName?: string | null;
}): Promise<{ tenantId: string; tenantName: string }> {
  const name = input.firmName.trim();
  if (!name) throw new Error("Firm name is required");

  const supabase = createServiceRoleSupabaseClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({ name, clerk_org_id: null })
    .select("id, name")
    .single();

  if (tenantError) throw tenantError;

  const { error: membershipError } = await supabase.from("memberships").insert({
    tenant_id: tenant.id,
    clerk_user_id: input.clerkUserId,
    role: "admin",
  });
  if (membershipError) throw membershipError;

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      context: "firm",
      email: input.email.trim().toLowerCase(),
      display_name: input.displayName ?? null,
      onboarding_complete: true,
    },
    { onConflict: "clerk_user_id" },
  );
  if (profileError) throw profileError;

  const clerk = await clerkClient();
  await clerk.users.updateUserMetadata(input.clerkUserId, {
    publicMetadata: { context: "firm" },
    unsafeMetadata: { context: "firm" },
  });

  return { tenantId: tenant.id, tenantName: tenant.name };
}
