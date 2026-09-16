import { randomBytes } from "crypto";
import { clerkClient } from "@clerk/nextjs/server";
import { getBrandName } from "@/lib/brand";
import { buildBrandedEmailHtml, isEmailConfigured, sendEmail } from "@/lib/email/send";
import { toAbsoluteAppUrl } from "@/lib/auth/app-url";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { UserContext } from "@/types/database";

const INVITE_TTL_DAYS = 14;

export type PlatformInviteRole = Extract<UserContext, "founder" | "investor" | "firm">;

export type PlatformInvitationRecord = {
  id: string;
  email: string;
  role: PlatformInviteRole;
  token: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
};

const ROLE_LABEL_ES: Record<PlatformInviteRole, string> = {
  founder: "Fundador",
  investor: "Inversionista",
  firm: "Firma",
};

function mapRow(row: {
  id: string;
  email: string;
  role: string;
  token: string;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}): PlatformInvitationRecord {
  return {
    id: row.id,
    email: row.email,
    role: row.role as PlatformInviteRole,
    token: row.token,
    expiresAt: row.expires_at,
    acceptedAt: row.accepted_at,
    createdAt: row.created_at,
  };
}

export function buildPlatformInviteUrl(token: string, email: string): string {
  const params = new URLSearchParams({
    token,
    email,
  });
  return toAbsoluteAppUrl(`/invitacion?${params.toString()}`);
}

export async function listPlatformInvitations(limit = 40): Promise<PlatformInvitationRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_invitations")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []).map(mapRow);
}

export async function getPlatformInvitationByToken(
  token: string,
): Promise<PlatformInvitationRecord | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_invitations")
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .eq("token", token)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data);
}

export function isPlatformInvitationValid(invitation: PlatformInvitationRecord): boolean {
  if (invitation.acceptedAt) return false;
  return new Date(invitation.expiresAt).getTime() > Date.now();
}

export async function createPlatformInvitation(input: {
  email: string;
  role: PlatformInviteRole;
  invitedBySub: string;
}): Promise<{
  invitation: PlatformInvitationRecord;
  inviteUrl: string;
  emailSent: boolean;
  emailError?: string;
}> {
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) throw new Error("invalid_email");

  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("platform_invitations")
    .insert({
      email,
      role: input.role,
      token,
      invited_by_sub: input.invitedBySub,
      expires_at: expiresAt.toISOString(),
    })
    .select("id, email, role, token, expires_at, accepted_at, created_at")
    .single();

  if (error) throw error;

  const invitation = mapRow(data);
  const inviteUrl = buildPlatformInviteUrl(token, email);
  const brand = getBrandName();
  const roleLabel = ROLE_LABEL_ES[invitation.role];

  const subject = `Invitación a ${brand} — acceso como ${roleLabel}`;
  const bodyHtml = `
    <p>Hola,</p>
    <p>Te invitaron a unirte a <strong>${brand}</strong> con el rol de <strong>${roleLabel}</strong>.</p>
    <p>Haz clic en el botón para crear tu cuenta (o iniciar sesión) y aceptar la invitación. El enlace vence en ${INVITE_TTL_DAYS} días.</p>
  `;
  const text = [
    `Te invitaron a unirte a ${brand} como ${roleLabel}.`,
    `Abre este enlace para aceptar: ${inviteUrl}`,
    `El enlace vence en ${INVITE_TTL_DAYS} días.`,
  ].join("\n\n");

  let emailSent = false;
  let emailError: string | undefined;

  if (!isEmailConfigured()) {
    emailError = "email_not_configured";
  } else {
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

async function setClerkWorkspaceContext(clerkUserId: string, context: PlatformInviteRole) {
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
    // Best-effort Clerk sync.
  }
}

export async function redeemPlatformInvitation(input: {
  token: string;
  clerkUserId: string;
  email: string;
}): Promise<PlatformInvitationRecord> {
  const invitation = await getPlatformInvitationByToken(input.token);
  if (!invitation || !isPlatformInvitationValid(invitation)) {
    throw new Error("Invitation invalid or expired");
  }

  const email = input.email.trim().toLowerCase();
  if (email !== invitation.email.toLowerCase()) {
    throw new Error("Invitation email mismatch");
  }

  const supabase = createServiceRoleSupabaseClient();
  const { error } = await supabase
    .from("platform_invitations")
    .update({
      accepted_at: new Date().toISOString(),
      accepted_by_sub: input.clerkUserId,
    })
    .eq("id", invitation.id)
    .is("accepted_at", null);

  if (error) throw error;

  await setClerkWorkspaceContext(input.clerkUserId, invitation.role);

  const { error: profileError } = await supabase.from("profiles").upsert(
    {
      clerk_user_id: input.clerkUserId,
      email,
      context: invitation.role,
      onboarding_complete: invitation.role !== "firm",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "clerk_user_id" },
  );
  if (profileError) throw profileError;

  return { ...invitation, acceptedAt: new Date().toISOString() };
}
