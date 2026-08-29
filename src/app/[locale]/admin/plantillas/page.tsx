import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateList } from "@/components/admin/template-editor";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminTemplates } from "@/lib/platform-admin/template-cms";

export default async function AdminTemplatesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/plantillas");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.templates");
  const templates = await listAdminTemplates();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <TemplateList templates={templates} />
      </div>
    </AppShell>
  );
}
