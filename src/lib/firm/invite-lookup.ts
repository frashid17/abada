import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getFirmInvitationByToken, isInvitationValid } from "@/lib/firm/invitations";

export async function getPendingInvitationForEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("firm_invitations")
    .select("id, tenant_id, email, role, token, expires_at, accepted_at")
    .eq("email", normalized)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const invitation = {
    id: data.id,
    tenantId: data.tenant_id,
    email: data.email,
    role: data.role,
    token: data.token,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
  };

  return isInvitationValid(invitation) ? invitation : null;
}

export async function resolveInviteForOnboarding(input: {
  inviteToken?: string;
  email?: string;
}) {
  if (input.inviteToken) {
    const byToken = await getFirmInvitationByToken(input.inviteToken);
    if (byToken && isInvitationValid(byToken)) return byToken;
  }
  if (input.email) {
    return getPendingInvitationForEmail(input.email);
  }
  return null;
}
