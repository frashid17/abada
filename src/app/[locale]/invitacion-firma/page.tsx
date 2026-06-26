import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FirmInviteAccept } from "@/components/firm/firm-invite-accept";
import {
  getFirmInvitationByToken,
  isInvitationValid,
} from "@/lib/firm/invitations";
import { getOnboardingRedirect } from "@/lib/onboarding/actions";

export default async function FirmInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("firm.invite");
  const { userId } = await auth();

  if (params.error === "membership_required") {
    return (
      <AppShell variant="public">
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-semibold">{t("membershipRequiredTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("membershipRequiredDescription")}</p>
        </div>
      </AppShell>
    );
  }

  const token = params.token?.trim();
  if (!token) {
    redirect("/iniciar-sesion");
  }

  const invitation = await getFirmInvitationByToken(token);
  if (!invitation || !isInvitationValid(invitation)) {
    return (
      <AppShell variant="public">
        <div className="mx-auto max-w-lg space-y-4 py-16 text-center">
          <h1 className="font-serif text-2xl font-semibold">{t("invalidTitle")}</h1>
          <p className="text-sm text-muted-foreground">{t("invalidDescription")}</p>
        </div>
      </AppShell>
    );
  }

  if (userId) {
    const destination = await getOnboardingRedirect(userId);
    if (destination) redirect(destination);
    redirect(`/onboarding?invite=${encodeURIComponent(token)}`);
  }

  return (
    <AppShell variant="public">
      <div className="mx-auto max-w-lg py-12">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description", { email: invitation.email })}
        />
        <FirmInviteAccept token={token} email={invitation.email} />
      </div>
    </AppShell>
  );
}
