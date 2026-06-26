import { currentUser } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { getActiveSession } from "@/lib/auth/session";
import { resolveInviteForOnboarding } from "@/lib/firm/invite-lookup";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { getOnboardingRedirect } from "@/lib/onboarding/actions";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;
  const { userId } = await getActiveSession();
  if (!userId) redirect("/registro");

  const done = await getOnboardingRedirect(userId);
  if (done) redirect(done);

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  const invitation = await resolveInviteForOnboarding({
    inviteToken: params.invite?.trim(),
    email,
  });

  const t = await getTranslations("onboarding");

  return (
    <AppShell variant="public">
      <div className="mx-auto max-w-4xl py-8 sm:py-12">
        <OnboardingWizard
          userEmail={email}
          invitation={
            invitation
              ? {
                  token: invitation.token,
                  email: invitation.email,
                  role: invitation.role as FirmMemberRole,
                }
              : null
          }
        />
        {!invitation && !params.invite ? (
          <p className="mt-8 text-center text-sm text-muted-foreground">{t("inviteHint")}</p>
        ) : null}
      </div>
    </AppShell>
  );
}
