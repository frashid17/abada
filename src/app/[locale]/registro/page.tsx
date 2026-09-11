import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { getActiveSession, hasActiveAppSession } from "@/lib/auth/session";
import { parseUserContext } from "@/lib/auth/user-context";
import {
  applyPreferredWorkspaceContext,
  getOnboardingRedirect,
} from "@/lib/onboarding/actions";
import {
  getFirmInvitationByToken,
  isInvitationValid,
} from "@/lib/firm/invitations";
import {
  getPlatformInvitationByToken,
  isPlatformInvitationValid,
} from "@/lib/platform-admin/invitations";

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{
    redirect_url?: string;
    invite?: string;
    platform_invite?: string;
    email?: string;
    context?: string;
  }>;
}) {
  const params = await searchParams;
  const inviteToken = params.invite?.trim();
  const platformInviteToken = params.platform_invite?.trim();
  const inviteEmail = params.email?.trim().toLowerCase();
  const preferredContext = parseUserContext(params.context);

  if (await hasActiveAppSession()) {
    const { userId } = await getActiveSession();
    if (userId) {
      if (platformInviteToken) {
        redirect(`/invitacion?token=${encodeURIComponent(platformInviteToken)}`);
      }
      if (preferredContext) {
        const applied = await applyPreferredWorkspaceContext(userId, preferredContext);
        redirect(params.redirect_url ?? applied ?? `/onboarding?context=${preferredContext}`);
      }
      const destination = (await getOnboardingRedirect(userId)) ?? "/onboarding";
      redirect(params.redirect_url ?? destination);
    }
  }

  if (inviteToken) {
    const invitation = await getFirmInvitationByToken(inviteToken);
    if (!invitation || !isInvitationValid(invitation)) {
      redirect(`/invitacion-firma?token=${encodeURIComponent(inviteToken)}`);
    }
  }

  if (platformInviteToken) {
    const invitation = await getPlatformInvitationByToken(platformInviteToken);
    if (!invitation || !isPlatformInvitationValid(invitation)) {
      redirect(`/invitacion?token=${encodeURIComponent(platformInviteToken)}`);
    }
  }

  const defaultRedirect = platformInviteToken
    ? `/invitacion?token=${encodeURIComponent(platformInviteToken)}`
    : preferredContext
      ? `/onboarding?context=${preferredContext}`
      : undefined;

  return (
    <AuthShell>
      <SignUpForm
        redirectUrl={params.redirect_url ?? defaultRedirect}
        inviteToken={inviteToken}
        platformInviteToken={platformInviteToken}
        inviteEmail={inviteEmail || undefined}
        preferredContext={preferredContext ?? undefined}
      />
    </AuthShell>
  );
}
