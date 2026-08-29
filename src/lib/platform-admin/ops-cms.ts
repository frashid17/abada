import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import { findClerkUserIdByEmail, requirePlatformAdmin } from "@/lib/platform-admin/auth";
import type { FeatureFlag } from "@/lib/feature-flags";
import type { UserContext } from "@/types/database";

export type AdminTenantRow = {
  id: string;
  name: string;
  memberCount: number;
  createdAt: string;
};

export type AdminPlatformAdminRow = {
  clerkUserId: string;
  email: string | null;
  displayName: string | null;
  createdAt: string;
};

export type AdminUserRow = {
  clerkUserId: string;
  email: string | null;
  displayName: string | null;
  context: "founder" | "investor" | "firm";
  onboardingComplete: boolean;
  isPlatformAdmin: boolean;
  adminSource: "db" | "env" | "metadata" | null;
  updatedAt: string;
};

export type AdminKnowledgeArticle = {
  id: string;
  tenantId: string;
  slug: string;
  title: string;
  excerpt: string | null;
  body: string;
  status: string;
  publishedAt: string | null;
};

export async function listAdminTenants(): Promise<AdminTenantRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data: tenants, error } = await supabase
    .from("tenants")
    .select("id, name, created_at")
    .order("name");
  if (error) throw error;

  const rows: AdminTenantRow[] = [];
  for (const tenant of tenants ?? []) {
    const { count } = await supabase
      .from("memberships")
      .select("id", { count: "exact", head: true })
      .eq("tenant_id", tenant.id);
    rows.push({
      id: tenant.id,
      name: tenant.name,
      memberCount: count ?? 0,
      createdAt: tenant.created_at,
    });
  }
  return rows;
}

export async function listAdminPlatformAdmins(): Promise<AdminPlatformAdminRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_admins")
    .select("clerk_user_id, email, display_name, created_at")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    clerkUserId: row.clerk_user_id,
    email: row.email ?? null,
    displayName: row.display_name,
    createdAt: row.created_at,
  }));
}

export async function addPlatformAdmin(email: string, displayName?: string): Promise<void> {
  await requirePlatformAdmin();
  const resolved = await findClerkUserIdByEmail(email);
  if (!resolved) {
    throw new Error("No Clerk user found for that email");
  }

  await setUserPlatformAdmin(resolved.clerkUserId, true);
  if (displayName?.trim()) {
    const supabase = createServiceRoleSupabaseClient();
    await supabase
      .from("platform_admins")
      .update({ display_name: displayName.trim() })
      .eq("clerk_user_id", resolved.clerkUserId);
  }
}

export async function removePlatformAdmin(clerkUserId: string): Promise<void> {
  await setUserPlatformAdmin(clerkUserId, false);
}

function parseEnvAdminEmails(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_SUBS ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.includes("@")),
  );
}

function parseEnvAdminSubs(): Set<string> {
  return new Set(
    (process.env.PLATFORM_ADMIN_SUBS ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.startsWith("user_")),
  );
}

export async function listAdminUsers(): Promise<AdminUserRow[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, email, display_name, context, onboarding_complete, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw error;

  const { data: adminRows } = await supabase.from("platform_admins").select("clerk_user_id");
  const dbAdmins = new Set((adminRows ?? []).map((row) => row.clerk_user_id));
  const envEmails = parseEnvAdminEmails();
  const envSubs = parseEnvAdminSubs();

  return (profiles ?? []).map((row) => {
    const email = row.email?.toLowerCase() ?? null;
    const inDb = dbAdmins.has(row.clerk_user_id);
    const inEnv =
      envSubs.has(row.clerk_user_id) || (email !== null && envEmails.has(email));
    const isPlatformAdmin = inDb || inEnv;
    const adminSource: AdminUserRow["adminSource"] = inDb
      ? "db"
      : inEnv
        ? "env"
        : null;

    return {
      clerkUserId: row.clerk_user_id,
      email: row.email,
      displayName: row.display_name,
      context: row.context as UserContext,
      onboardingComplete: Boolean(row.onboarding_complete),
      isPlatformAdmin,
      adminSource,
      updatedAt: row.updated_at,
    };
  });
}

export async function setUserPlatformAdmin(
  clerkUserId: string,
  enabled: boolean,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  if (clerkUserId === actorSub && !enabled) {
    throw new Error("You cannot remove your own platform admin access");
  }

  const supabase = createServiceRoleSupabaseClient();
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const email =
    user.primaryEmailAddress?.emailAddress?.trim().toLowerCase() ??
    user.emailAddresses[0]?.emailAddress?.trim().toLowerCase() ??
    null;
  const displayName =
    user.fullName ??
    ([user.firstName, user.lastName].filter(Boolean).join(" ") || null);

  if (enabled) {
    const { error } = await supabase.from("platform_admins").upsert({
      clerk_user_id: clerkUserId,
      email,
      display_name: displayName,
    });
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from("platform_admins")
      .delete()
      .eq("clerk_user_id", clerkUserId);
    if (error) throw error;
  }

  const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...existingPublic, platformAdmin: enabled },
  });

  await writeAuditLog({
    action: enabled ? "platform.admin.added" : "platform.admin.removed",
    actorSub,
    resourceType: "platform_admin",
    resourceId: clerkUserId,
    metadata: { email, via: "users_panel" },
  });
}

export async function setUserContext(
  clerkUserId: string,
  context: UserContext,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  if (!["founder", "investor", "firm"].includes(context)) {
    throw new Error("Invalid context");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      context,
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId);
  if (error) throw error;

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const existingUnsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...existingPublic, context },
    unsafeMetadata: { ...existingUnsafe, context },
  });

  await writeAuditLog({
    action: "platform.user.context_updated",
    actorSub,
    resourceType: "profile",
    resourceId: clerkUserId,
    metadata: { context },
  });
}

export async function listFeatureFlagOverrides(): Promise<Record<string, boolean>> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.from("platform_feature_flag_overrides").select("*");
  if (error) throw error;
  const out: Record<string, boolean> = {};
  for (const row of data ?? []) {
    out[row.flag_key] = row.enabled;
  }
  return out;
}

export async function setFeatureFlagOverride(
  flagKey: FeatureFlag,
  enabled: boolean,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("platform_feature_flag_overrides").upsert({
    flag_key: flagKey,
    enabled,
    updated_by: actorSub,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  await writeAuditLog({
    action: "platform.feature_flag.updated",
    actorSub,
    resourceType: "feature_flag",
    resourceId: flagKey,
    metadata: { enabled },
  });
}

export async function getFeatureFlagOverridesMap(): Promise<Record<string, boolean>> {
  try {
    const supabase = createServiceRoleSupabaseClient();
    const { data, error } = await supabase.from("platform_feature_flag_overrides").select("*");
    if (error) throw error;
    const out: Record<string, boolean> = {};
    for (const row of data ?? []) {
      out[row.flag_key] = row.enabled;
    }
    return out;
  } catch {
    return {};
  }
}

export async function listAdminKnowledgeArticles(): Promise<AdminKnowledgeArticle[]> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("knowledge_hub_articles")
    .select("id, tenant_id, slug, title, excerpt, body, status, published_at")
    .order("title");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    tenantId: row.tenant_id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status,
    publishedAt: row.published_at,
  }));
}

export async function upsertKnowledgeArticle(input: {
  id?: string;
  tenantId: string;
  slug: string;
  title: string;
  excerpt?: string;
  body: string;
  status: "draft" | "published" | "archived";
}): Promise<string> {
  const actorSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const payload = {
    tenant_id: input.tenantId,
    slug: input.slug.trim(),
    title: input.title.trim(),
    excerpt: input.excerpt?.trim() || null,
    body: input.body,
    status: input.status,
    published_at: input.status === "published" ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };

  if (input.id) {
    const { error } = await supabase.from("knowledge_hub_articles").update(payload).eq("id", input.id);
    if (error) throw error;
    await writeAuditLog({
      action: "platform.knowledge.updated",
      actorSub,
      resourceType: "knowledge_hub_article",
      resourceId: input.id,
      tenantId: input.tenantId,
    });
    return input.id;
  }

  const { data, error } = await supabase
    .from("knowledge_hub_articles")
    .insert(payload)
    .select("id")
    .single();
  if (error) throw error;
  await writeAuditLog({
    action: "platform.knowledge.created",
    actorSub,
    resourceType: "knowledge_hub_article",
    resourceId: data.id,
    tenantId: input.tenantId,
  });
  return data.id;
}

export async function deleteKnowledgeArticle(id: string): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("knowledge_hub_articles").delete().eq("id", id);
  if (error) throw error;
  await writeAuditLog({
    action: "platform.knowledge.deleted",
    actorSub,
    resourceType: "knowledge_hub_article",
    resourceId: id,
  });
}
