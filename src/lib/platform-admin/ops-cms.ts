import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { writeAuditLog } from "@/lib/audit";
import {
  findClerkUserIdByEmail,
  primaryEmailFromClerkUser,
  requirePlatformAdmin,
} from "@/lib/platform-admin/auth";
import {
  detectClerkKeyMode,
  normalizeEmail,
  parseAdminAllowlist,
  type ClerkKeyMode,
} from "@/lib/platform-admin/clerk-env";
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
  adminSource: "env" | "clerk" | null;
  updatedAt: string;
};

export type AdminUsersListResult = {
  users: AdminUserRow[];
  clerkMode: ClerkKeyMode;
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

function isUserContext(value: unknown): value is UserContext {
  return value === "founder" || value === "investor" || value === "firm";
}

async function listAllClerkUsers() {
  const clerk = await clerkClient();
  const users = [];
  let offset = 0;
  const limit = 100;

  for (;;) {
    const page = await clerk.users.getUserList({
      limit,
      offset,
      orderBy: "-created_at",
    });
    users.push(...page.data);
    if (page.data.length < limit) break;
    offset += limit;
    if (offset > 10_000) break;
  }

  return users;
}

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
  const { users } = await listAdminUsers();
  return users
    .filter((user) => user.isPlatformAdmin)
    .map((user) => ({
      clerkUserId: user.clerkUserId,
      email: user.email,
      displayName: user.displayName,
      createdAt: user.updatedAt,
    }));
}

export async function addPlatformAdmin(email: string, displayName?: string): Promise<void> {
  await requirePlatformAdmin();
  const resolved = await findClerkUserIdByEmail(email);
  if (!resolved) {
    throw new Error("No Clerk user found for that email in the current Clerk instance");
  }

  await setUserPlatformAdmin(resolved.clerkUserId, true);

  if (displayName?.trim()) {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(resolved.clerkUserId);
    const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
    await clerk.users.updateUserMetadata(resolved.clerkUserId, {
      publicMetadata: {
        ...existingPublic,
        platformAdmin: true,
        displayNameOverride: displayName.trim(),
      },
    });
  }
}

export async function removePlatformAdmin(clerkUserId: string): Promise<void> {
  await setUserPlatformAdmin(clerkUserId, false);
}

export async function listAdminUsers(): Promise<AdminUsersListResult> {
  await requirePlatformAdmin();
  const clerkMode = detectClerkKeyMode();
  const allowlist = parseAdminAllowlist();
  const clerkUsers = await listAllClerkUsers();

  // Optional onboarding mirror from profiles — only for Clerk users that exist now.
  const supabase = createServiceRoleSupabaseClient();
  const clerkIds = clerkUsers.map((user) => user.id);
  const onboardingBySub = new Map<string, boolean>();
  if (clerkIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("clerk_user_id, onboarding_complete")
      .in("clerk_user_id", clerkIds);
    for (const row of profiles ?? []) {
      onboardingBySub.set(row.clerk_user_id, Boolean(row.onboarding_complete));
    }
  }

  const users: AdminUserRow[] = clerkUsers.map((user) => {
    const email = primaryEmailFromClerkUser(user);
    const meta = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const unsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
    const contextRaw = meta.context ?? unsafe.context;
    const context: UserContext = isUserContext(contextRaw) ? contextRaw : "founder";
    const inEnv =
      allowlist.includes(user.id) ||
      (email !== null && allowlist.some((entry) => normalizeEmail(entry) === email));
    const inClerk = meta.platformAdmin === true;
    const isPlatformAdmin = inEnv || inClerk;
    const adminSource: AdminUserRow["adminSource"] = inEnv ? "env" : inClerk ? "clerk" : null;
    const displayName =
      (typeof meta.displayNameOverride === "string" && meta.displayNameOverride) ||
      user.fullName ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      null;
    const onboardingFromMeta =
      typeof meta.onboardingComplete === "boolean" ? meta.onboardingComplete : null;

    return {
      clerkUserId: user.id,
      email,
      displayName,
      context,
      onboardingComplete:
        onboardingFromMeta ?? onboardingBySub.get(user.id) ?? false,
      isPlatformAdmin,
      adminSource,
      updatedAt: new Date(user.updatedAt).toISOString(),
    };
  });

  return { users, clerkMode };
}

export async function setUserPlatformAdmin(
  clerkUserId: string,
  enabled: boolean,
): Promise<void> {
  const actorSub = await requirePlatformAdmin();
  if (clerkUserId === actorSub && !enabled) {
    throw new Error("You cannot remove your own platform admin access");
  }

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const email = primaryEmailFromClerkUser(user);
  const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...existingPublic, platformAdmin: enabled },
  });

  await writeAuditLog({
    action: enabled ? "platform.admin.added" : "platform.admin.removed",
    actorSub,
    resourceType: "platform_admin",
    resourceId: clerkUserId,
    metadata: { email, via: "clerk_metadata", clerkMode: detectClerkKeyMode() },
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

  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
  const existingUnsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
  await clerk.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { ...existingPublic, context },
    unsafeMetadata: { ...existingUnsafe, context },
  });

  // Mirror into the app profile when it already exists for this Clerk user.
  const supabase = createServiceRoleSupabaseClient();
  await supabase
    .from("profiles")
    .update({
      context,
      updated_at: new Date().toISOString(),
    })
    .eq("clerk_user_id", clerkUserId);

  await writeAuditLog({
    action: "platform.user.context_updated",
    actorSub,
    resourceType: "clerk_user",
    resourceId: clerkUserId,
    metadata: { context, via: "clerk_metadata", clerkMode: detectClerkKeyMode() },
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
