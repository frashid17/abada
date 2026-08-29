import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DocumentArticleEditor } from "@/components/admin/document-article-editor";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { findArticleInDoc, getAdminPackDraft } from "@/lib/platform-admin/document-cms";
import { isPrototypeDocId } from "@/lib/documents/prototype/catalog";

export default async function AdminDocumentArticlePage({
  params,
}: {
  params: Promise<{ packId: string; articleId: string }>;
}) {
  const { packId, articleId } = await params;
  if (!isPrototypeDocId(packId)) notFound();

  const { userId } = await auth();
  if (!userId) redirect(`/iniciar-sesion?redirect_url=/admin/documentos/${packId}/${articleId}`);
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.documents");
  const doc = await getAdminPackDraft(packId);
  const found = findArticleInDoc(doc, articleId);
  if (!found) notFound();

  return (
    <AppShell variant="admin">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex items-end justify-between gap-4">
          <PageHeader eyebrow={t("eyebrow")} title={found.article.t_es} description={packId} />
          <Button asChild variant="outline">
            <Link href={`/admin/documentos/${packId}`}>{t("back")}</Link>
          </Button>
        </div>
        <DocumentArticleEditor packId={packId} article={found.article} />
      </div>
    </AppShell>
  );
}
