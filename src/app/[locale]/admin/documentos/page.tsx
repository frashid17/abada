import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentPackList } from "@/components/admin/document-pack-list";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminDocumentPacks } from "@/lib/platform-admin/document-cms";

export default async function AdminDocumentsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/documentos");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.documents");
  const packs = await listAdminDocumentPacks();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <DocumentPackList packs={packs} />
      </div>
    </AppShell>
  );
}
