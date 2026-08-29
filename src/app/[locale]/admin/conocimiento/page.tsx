import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { KnowledgeHubAdminPanel } from "@/components/admin/knowledge-hub-admin-panel";
import { getPrimaryFirmTenantId } from "@/lib/firm/tenant";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminKnowledgeArticles } from "@/lib/platform-admin/ops-cms";

export default async function AdminKnowledgePage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/conocimiento");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.knowledge");
  const tenantId = await getPrimaryFirmTenantId();
  if (!tenantId) redirect("/admin");

  const articles = await listAdminKnowledgeArticles();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <KnowledgeHubAdminPanel articles={articles} tenantId={tenantId} />
      </div>
    </AppShell>
  );
}
