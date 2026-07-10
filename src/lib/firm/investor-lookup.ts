import type { User } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type InvestorOption = {
  clerkUserId: string;
  displayName: string | null;
  email: string | null;
};

type InvestorProfileRow = {
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
}): InvestorOption {
  return {
    clerkUserId: row.clerk_user_id,
    displayName: row.display_name,
    email: row.email,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function isInvestorContext(value: unknown): boolean {
  return value === "investor";
}

function pickBestProfile(profiles: InvestorProfileRow[]): InvestorProfileRow {
  return [...profiles].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0]!;
}

function pickBestClerkUser(users: User[]): User {
  return [...users].sort((a, b) => b.createdAt - a.createdAt)[0]!;
}

async function syncInvestorProfileFromClerk(clerkUserId: string): Promise<InvestorOption | null> {
  const clerk = await clerkClient();
  const user = await clerk.users.getUser(clerkUserId);
  const context =
    (user.publicMetadata?.context as string | undefined) ??
    (user.unsafeMetadata?.context as string | undefined);

  if (!isInvestorContext(context)) return null;

  const displayName =
    user.fullName ?? ([user.firstName, user.lastName].filter(Boolean).join(" ") || null);
  const email = user.primaryEmailAddress?.emailAddress ?? null;

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: user.id,
      context: "investor",
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

export async function resolveInvestorByEmail(email: string): Promise<InvestorOption | null> {
  const normalized = normalizeEmail(email);
  if (!normalized) return null;

  const supabase = createServiceRoleSupabaseClient();
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("clerk_user_id, display_name, email, context, updated_at")
    .ilike("email", normalized)
    .limit(10);

  if (error) throw error;

  const investorProfiles = (profiles ?? []).filter((profile) => profile.context === "investor");
  if (investorProfiles.length > 0) {
    return mapProfile(pickBestProfile(investorProfiles));
  }

  const clerk = await clerkClient();
  const { data: users } = await clerk.users.getUserList({
    emailAddress: [normalized],
    limit: 10,
  });

  const investorUsers = users.filter((user) => {
    const context =
      (user.publicMetadata?.context as string | undefined) ??
      (user.unsafeMetadata?.context as string | undefined);
    return isInvestorContext(context);
  });

  if (investorUsers.length === 0) return null;

  const user = pickBestClerkUser(investorUsers);
  return syncInvestorProfileFromClerk(user.id);
}
