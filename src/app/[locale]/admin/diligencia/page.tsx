import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { AdminDdQuestionsPanel } from "@/components/admin/admin-dd-questions-panel";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminDdQuestions } from "@/lib/dd/questionnaire-cms";

export default async function AdminDiligencePage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/diligencia");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.diligence");
  const questions = await listAdminDdQuestions();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <AdminDdQuestionsPanel questions={questions} />
      </div>
    </AppShell>
  );
}
