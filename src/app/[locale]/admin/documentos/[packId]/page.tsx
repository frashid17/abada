import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getAdminPackDraft } from "@/lib/platform-admin/document-cms";
import { isPrototypeDocId } from "@/lib/documents/prototype/catalog";

export default async function AdminDocumentPackPage({
  params,
}: {
  params: Promise<{ packId: string }>;
}) {
  const { packId } = await params;
  if (!isPrototypeDocId(packId)) notFound();

  const { userId } = await auth();
  if (!userId) redirect(`/iniciar-sesion?redirect_url=/admin/documentos/${packId}`);
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.documents");
  const doc = await getAdminPackDraft(packId);
  const articles = doc.groups.flatMap((group) => group.arts);

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <div className="flex items-end justify-between gap-4">
          <PageHeader eyebrow={t("eyebrow")} title={doc.t_es} description={doc.sub_es} />
          <Button asChild variant="outline">
            <Link href="/admin/documentos">{t("back")}</Link>
          </Button>
        </div>
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {articles.map((article, index) => (
            <div key={article.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {article.n} · {index + 1}
                </p>
                <p className="font-medium">{article.t_es}</p>
              </div>
              <Button asChild size="sm" variant="outline">
                <Link href={`/admin/documentos/${packId}/${article.id}`}>{t("editArticle")}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
