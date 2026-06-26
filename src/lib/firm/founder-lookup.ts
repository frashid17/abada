import type { User } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type FounderOption = {
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
};

type FounderProfileRow = {
  clerk_user_id: string;
  display_name: string | null;
  email: string | null;
  context: string;
  updated_at: string;
};

function mapProfile(row: {
  clerk_user_id: string;
  display_name: string | null;
  email: string | null;
}): FounderOption {
  return {
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    email: row.email,
  };
}

function sortFounders(founders: FounderOption[]): FounderOption[] {
  return founders.sort((a, b) => {
    const aLabel = (a.displayName ?? a.email ?? a.clerkUserId).toLowerCase();
    const bLabel = (b.displayName ?? b.email ?? b.clerkUserId).toLowerCase();
    return aLabel.localeCompare(bLabel);
  });
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isFounderContext(value: unknown): boolean {
  return value === "founder" || value === undefined || value === null;
}

async function collectKnownFounderSubs(tenantId: string): Promise<Set<string>> {
  const supabase = createServiceRoleSupabaseClient();
  const subs = new Set<string>();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("requester_sub")
    .eq("tenant_id", tenantId);

  for (const review of reviews ?? []) {
    subs.add(review.requester_sub);
  }

  const { data: documents } = await supabase
    .from("documents")
    .select("owner_sub")
    .eq("tenant_id", tenantId);

  for (const document of documents ?? []) {
    subs.add(document.owner_sub);
  }

  const { data: deals } = await supabase
    .from("deals")
    .select("id")
    .eq("tenant_id", tenantId);

  const dealIds = (deals ?? []).map((deal) => deal.id);
  if (dealIds.length > 0) {
    const { data: participants } = await supabase
      .from("deal_participants")
      .select("participant_sub")
      .in("deal_id", dealIds)
      .eq("role", "target");

    for (const participant of participants ?? []) {
      subs.add(participant.participant_sub);
    }
  }

  return subs;
}

function pickBestFounderProfile(
  profiles: FounderProfileRow[],
  preferredSubs: Set<string>,
): FounderProfileRow {
  const knownMatch = profiles.find((profile) => preferredSubs.has(profile.clerk_user_id));
  if (knownMatch) return knownMatch;

  return [...profiles].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]!;
}

function pickBestClerkUser(users: User[], preferredSubs: Set<string>): User {
  const knownMatch = users.find((user) => preferredSubs.has(user.id));
  if (knownMatch) return knownMatch;

  return [...users].sort((a, b) => b.createdAt - a.createdAt)[0]!;
}

async function syncFounderProfileFromClerk(clerkUserId: string): Promise<FounderOption | null> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const context =
    (user.publicMetadata?.context as string | undefined) ??
    (user.unsafeMetadata?.context as string | undefined);

  if (!isFounderContext(context)) return null;

  const displayName =
    user.fullName ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || null);
  const email = user.primaryEmailAddress?.emailAddress ?? null;

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: user.id,
      context: "founder",
      display_name: displayName,
      email,
      avatar_url: user.imageUrl,
    },
    { onConflict: "clerk_user_id" },
  );

  if (error) throw error;

  return {
    clerkUserId: user.id,
    displayName,
    email,
  };
}

export async function listKnownFoundersForFirm(tenantId: string): Promise<FounderOption[]> {
  const subs = await collectKnownFounderSubs(tenantId);
  if (subs.size === 0) return [];

  const supabase = createServiceRoleSupabaseClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, display_name, email")
    .in("clerk_user_id", [...subs])
    .eq("context", "founder");

  if (error) throw error;

  return sortFounders((profiles ?? []).map(mapProfile));
}

export async function resolveFounderByEmail(
  email: string,
  options?: { tenantId?: string },
): Promise<FounderOption | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const preferredSubs = options?.tenantId
    ? await collectKnownFounderSubs(options.tenantId)
    : new Set<string>();

  const supabase = createServiceRoleSupabaseClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, display_name, email, context, updated_at")
    .ilike("email", normalized)
    .limit(10);

  if (error) throw error;

  const founderProfiles = (profiles ?? []).filter((profile) => profile.context === "founder");
  if (founderProfiles.length > 0) {
    return mapProfile(pickBestFounderProfile(founderProfiles, preferredSubs));
  }

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 10,
  });

  const founderUsers = users.filter((user) => {
    const context =
      (user.publicMetadata?.context as string | undefined) ??
      (user.unsafeMetadata?.context as string | undefined);
    return isFounderContext(context);
  });

  if (founderUsers.length === 0) return null;

  const user = pickBestClerkUser(founderUsers, preferredSubs);
  return syncFounderProfileFromClerk(user.id);
}
