import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformInvitePanel } from "@/components/admin/platform-invite-panel";
import { isEmailConfigured } from "@/lib/email/send";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listPlatformInvitations } from "@/lib/platform-admin/invitations";

export default async function AdminInvitesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/invitaciones");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.invites");
  const invitations = await listPlatformInvitations();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <PlatformInvitePanel invitations={invitations} emailConfigured={isEmailConfigured()} />
      </div>
    </AppShell>
  );
}
