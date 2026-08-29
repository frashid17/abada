import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PlatformUsersPanel } from "@/components/admin/platform-users-panel";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminUsers } from "@/lib/platform-admin/ops-cms";

export default async function AdminTeamPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/equipo");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.team");
  const users = await listAdminUsers();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <PlatformUsersPanel users={users} />
      </div>
    </AppShell>
  );
}
