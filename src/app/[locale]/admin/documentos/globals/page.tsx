import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentGlobalsEditor } from "@/components/admin/document-globals-editor";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getAdminGlobalsDraft } from "@/lib/platform-admin/document-cms";

export default async function AdminDocumentGlobalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/documentos/globals");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.documents");
  const globals = await getAdminGlobalsDraft();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-4">
          <PageHeader eyebrow={t("eyebrow")} title={t("globalsTitle")} description={t("globalsSubtitle")} />
          <Button asChild variant="outline">
            <Link href="/admin/documentos">{t("back")}</Link>
          </Button>
        </div>
        <DocumentGlobalsEditor tokens={globals.tokens} />
      </div>
    </AppShell>
  );
}
