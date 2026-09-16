import { randomBytes } from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { getBrandName } from "@/lib/brand";
import { buildBrandedEmailHtml, isEmailConfigured, sendEmail } from "@/lib/email/send";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { resolveDefaultFirmTenantId } from "@/lib/firm/reviews";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { toAbsoluteAppUrl } from "@/lib/auth/app-url";

const FIRM_ROLE_LABEL_ES: Record<FirmMemberRole, string> = {
  admin: "Administrador",
  partner: "Socio",
  associate: "Asociado",
  of_counsel: "Of counsel",
};

const INVITE_TTL_DAYS = 7;

async function setClerkWorkspaceContext(clerkUserId: string, context: "firm") {
  try {
    const clerk = await clerkClient();
    const user = await clerk.users.getUser(clerkUserId);
    const existingPublic = (user.publicMetadata ?? {}) as Record<string, unknown>;
    const existingUnsafe = (user.unsafeMetadata ?? {}) as Record<string, unknown>;
    await clerk.users.updateUserMetadata(clerkUserId, {
      publicMetadata: { ...existingPublic, context },
      unsafeMetadata: { ...existingUnsafe, context },
    });
  } catch {
    // Clerk metadata sync is best-effort; profile context still gates workspace.
  }
}

export type FirmInvitationRecord = {
  id: string;
  tenantId: string;
  email: string;
  role: FirmMemberRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
};

function mapRow(row: {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
}): FirmInvitationRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    email: row.email,
    role: row.role as FirmMemberRole,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
  };
}

export function buildFirmInviteUrl(token: string): string {
  return toAbsoluteAppUrl(`/invitacion-firma?token=${encodeURIComponent(token)}`);
}

export async function createFirmInvitation(input: {
  email: string;
  role: FirmMemberRole;
  invitedBySub: string;
  tenantId?: string;
}): Promise<{
  invitation: FirmInvitationRecord;
  inviteUrl: string;
  emailSent: boolean;
  emailError?: string;
}> {
  const tenantId = input.tenantId ?? (await resolveDefaultFirmTenantId());
  if (!tenantId) throw new Error("Firm tenant not configured");

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
  const email = input.email.trim().toLowerCase();

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("firm_invitations")
    .insert({
      tenant_id: tenantId,
      email,
      role: input.role,
      token,
      invited_by_sub: input.invitedBySub,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, tenant_id, email, role, token, expires_at, accepted_at")
    .single();

  if (error) throw error;

  const invitation = mapRow(data);
  const inviteUrl = buildFirmInviteUrl(token);
  const brand = getBrandName();
  const roleLabel = FIRM_ROLE_LABEL_ES[invitation.role];

  let emailSent = false;
  let emailError: string | undefined;

  if (!isEmailConfigured()) {
    emailError = "email_not_configured";
  } else {
    const subject = `Invitación a ${brand} — equipo de la firma (${roleLabel})`;
    const bodyHtml = `
      <p>Hola,</p>
      <p>Te invitaron a unirte al equipo de la firma en <strong>${brand}</strong> con el rol de <strong>${roleLabel}</strong>.</p>
      <p>Haz clic en el botón para crear tu cuenta (o iniciar sesión) y aceptar la invitación. El enlace vence en ${INVITE_TTL_DAYS} días.</p>
    `;
    const text = [
      `Te invitaron a unirte al equipo de la firma en ${brand} como ${roleLabel}.`,
      `Abre este enlace para aceptar: ${inviteUrl}`,
      `El enlace vence en ${INVITE_TTL_DAYS} días.`,
    ].join("\n\n");

    const branded = buildBrandedEmailHtml({
      title: `Invitación a ${brand}`,
      bodyHtml,
      ctaLabel: "Aceptar invitación",
      ctaUrl: inviteUrl,
      footer: `Este correo lo envió ${brand}. Si no esperabas esta invitación, puedes ignorarlo.`,
    });

    const result = await sendEmail({
      to: email,
      subject,
      html: branded.html,
      text,
      attachments: branded.attachments,
    });
    emailSent = result.ok;
    if (!result.ok) emailError = result.error;
  }

  return { invitation, inviteUrl, emailSent, emailError };
}

export async function getFirmInvitationByToken(
  token: string,
): Promise<FirmInvitationRecord | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("firm_invitations")
    .select("id, tenant_id, email, role, token, expires_at, accepted_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data);
}

export function isInvitationValid(invitation: FirmInvitationRecord): boolean {
  if (invitation.acceptedAt) return false;
  return new Date(invitation.expiresAt).getTime() > Date.now();
}

export async function redeemFirmInvitation(input: {
  token: string;
  clerkUserId: string;
  email: string;
}): Promise<FirmInvitationRecord> {
  const invitation = await getFirmInvitationByToken(input.token);
  if (!invitation || !isInvitationValid(invitation)) {
    throw new Error("Invitation invalid or expired");
  }

  const normalizedEmail = input.email.trim().toLowerCase();
  if (normalizedEmail !== invitation.email.toLowerCase()) {
    throw new Error("Email does not match invitation");
  }

  const supabase = createServiceRoleSupabaseClient();
  const now = new Date().toISOString();

  const { error: membershipError } = await supabase.from("memberships").upsert(
    {
      tenant_id: invitation.tenantId,
      clerk_user_id: input.clerkUserId,
      role: invitation.role,
    },
    { onConflict: "tenant_id,clerk_user_id" },
  );
  if (membershipError) throw membershipError;

  await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      context: "firm",
      email: normalizedEmail,
      onboarding_complete: true,
    },
    { onConflict: "clerk_user_id" },
  );

  await setClerkWorkspaceContext(input.clerkUserId, "firm");

  const { data, error } = await supabase
    .from("firm_invitations")
    .update({
      accepted_at: now,
      accepted_by_sub: input.clerkUserId,
    })
    .eq("id", invitation.id)
    .select("id, tenant_id, email, role, token, expires_at, accepted_at")
    .single();

  if (error) throw error;
  return mapRow(data);
}

export async function listPendingFirmInvitations(tenantId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("firm_invitations")
    .select("id, tenant_id, email, role, token, expires_at, accepted_at, created_at")
    .eq("tenant_id", tenantId)
    .is("accepted_at", null)
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map((row) => ({
    ...mapRow(row),
    createdAt: row.created_at as string,
    inviteUrl: buildFirmInviteUrl(row.token),
  }));
}

export async function listFirmMembers(tenantId: string) {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("memberships")
    .select("id, clerk_user_id, role, created_at")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  if (!data?.length) return [];

  const userIds = data.map((row) => row.clerk_user_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("clerk_user_id, display_name, email")
    .in("clerk_user_id", userIds);

  const profileByUser = new Map(
    (profiles ?? []).map((p) => [p.clerk_user_id, p]),
  );

  return data.map((row) => {
    const profile = profileByUser.get(row.clerk_user_id);
    return {
      id: row.id as string,
      clerkUserId: row.clerk_user_id as string,
      role: row.role as FirmMemberRole,
      displayName: profile?.display_name ?? null,
      email: profile?.email ?? null,
      createdAt: row.created_at as string,
    };
  });
}

export type FirmMember = Awaited<ReturnType<typeof listFirmMembers>>[number];

const FIRM_MEMBER_ROLES: FirmMemberRole[] = ["admin", "partner", "associate", "of_counsel"];

export function isFirmMemberRole(value: string): value is FirmMemberRole {
  return FIRM_MEMBER_ROLES.includes(value as FirmMemberRole);
}

async function countTenantAdmins(tenantId: string): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const { count, error } = await supabase
    .from("memberships")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "admin");

  if (error) throw error;
  return count ?? 0;
}

export async function updateFirmMemberRole(input: {
  tenantId: string;
  membershipId: string;
  role: FirmMemberRole;
  actorClerkUserId: string;
}): Promise<void> {
  if (!isFirmMemberRole(input.role)) {
    throw new Error("invalid_role");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { data: member, error: loadError } = await supabase
    .from("memberships")
    .select("id, clerk_user_id, role, tenant_id")
    .eq("id", input.membershipId)
    .eq("tenant_id", input.tenantId)
    .maybeSingle();

  if (loadError) throw loadError;
  if (!member) throw new Error("member_not_found");
  if (member.role === input.role) return;

  if (member.role === "admin" && input.role !== "admin") {
    const adminCount = await countTenantAdmins(input.tenantId);
    if (adminCount <= 1) {
      throw new Error("last_admin");
    }
  }

  const { error: updateError } = await supabase
    .from("memberships")
    .update({ role: input.role })
    .eq("id", input.membershipId)
    .eq("tenant_id", input.tenantId);

  if (updateError) throw updateError;

  try {
    await supabase.from("audit_logs").insert({
      actor_sub: input.actorClerkUserId,
      action: "firm.member_role_updated",
      resource_type: "membership",
      resource_id: input.membershipId,
      tenant_id: input.tenantId,
      metadata: {
        targetClerkUserId: member.clerk_user_id,
        previousRole: member.role,
        newRole: input.role,
      },
    });
  } catch {
    // Audit is best-effort
  }
}

export function isFirmBootstrapEmail(email: string): boolean {
  const bootstrap = process.env.FIRM_BOOTSTRAP_ADMIN_EMAIL?.trim().toLowerCase();
  if (!bootstrap) return false;
  return email.trim().toLowerCase() === bootstrap;
}

export function isFirmBootstrapEmailConfigured(): boolean {
  return Boolean(process.env.FIRM_BOOTSTRAP_ADMIN_EMAIL?.trim());
}

export async function bootstrapFirmAdmin(input: {
  clerkUserId: string;
  email: string;
}): Promise<void> {
  if (!isFirmBootstrapEmail(input.email)) {
    throw new Error("Not a bootstrap admin email");
  }

  const tenantId = await resolveDefaultFirmTenantId();
  if (!tenantId) throw new Error("Firm tenant not configured");

  const supabase = createServiceRoleSupabaseClient();
  await supabase.from("memberships").upsert(
    {
      tenant_id: tenantId,
      clerk_user_id: input.clerkUserId,
      role: "admin",
    },
    { onConflict: "tenant_id,clerk_user_id" },
  );

  await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      context: "firm",
      email: input.email.trim().toLowerCase(),
    },
    { onConflict: "clerk_user_id" },
  );

  await setClerkWorkspaceContext(input.clerkUserId, "firm");
}
