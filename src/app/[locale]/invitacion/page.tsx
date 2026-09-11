import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AuthShell } from "@/components/auth/auth-shell";
import { PlatformInviteAccept } from "@/components/admin/platform-invite-accept";
import {
  getPlatformInvitationByToken,
  isPlatformInvitationValid,
} from "@/lib/platform-admin/invitations";
import { Button } from "@/components/ui/button";

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function PlatformInvitePage({ searchParams }: Props) {
  const params = await searchParams;
  const token = params.token?.trim() ?? "";
  const t = await getTranslations("admin.inviteAccept");
  const tRoles = await getTranslations("admin.invites.roles");

  if (!token) {
    return (
      <AuthShell>
        <div className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-serif text-2xl font-semibold">{t("invalidTitle")}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("invalidBody")}</p>
        </div>
      </AuthShell>
    );
  }

  const invitation = await getPlatformInvitationByToken(token);
  const valid = invitation ? isPlatformInvitationValid(invitation) : false;
  const { userId } = await auth();

  if (!userId) {
    const signUp = `/registro?platform_invite=${encodeURIComponent(token)}&email=${encodeURIComponent(invitation?.email ?? params.email ?? "")}`;
    const signIn = `/iniciar-sesion?redirect_url=${encodeURIComponent(`/invitacion?token=${encodeURIComponent(token)}`)}`;

    return (
      <AuthShell>
        <div className="mx-auto max-w-lg space-y-6 p-8 text-center">
          <h1 className="font-serif text-2xl font-semibold">{t("guestTitle")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("guestBody", {
              email: invitation?.email ?? params.email ?? "—",
              role: invitation ? tRoles(invitation.role) : "—",
            })}
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button asChild>
              <Link href={signUp}>{t("createAccountCta")}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={signIn}>{t("signInCta")}</Link>
            </Button>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="p-6 sm:p-10">
        <PlatformInviteAccept
          token={token}
          email={invitation?.email ?? ""}
          roleLabel={invitation ? tRoles(invitation.role) : ""}
          valid={valid}
        />
      </div>
    </AuthShell>
  );
}
