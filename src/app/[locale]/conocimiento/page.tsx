import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listPublishedKnowledgeArticles } from "@/lib/knowledge-hub/service";
import { resolveAppShellVariant } from "@/lib/layout/shell-variant";

export default async function KnowledgeHubPage() {
  const t = await getTranslations("knowledgeHub");
  const articles = await listPublishedKnowledgeArticles();
  const shellVariant = await resolveAppShellVariant();

  return (
    <AppShell variant={shellVariant}>
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <div className="grid gap-4 md:grid-cols-2">
          {articles.map((article) => (
            <Card key={article.id} variant="elevated" className="h-full">
              <CardHeader>
                <CardTitle className="text-lg leading-snug">
                  <Link href={`/conocimiento/${article.slug}`} className="hover:text-primary">
                    {article.title}
                  </Link>
                </CardTitle>
                {article.excerpt ? <CardDescription>{article.excerpt}</CardDescription> : null}
              </CardHeader>
              <CardContent>
                <Link
                  href={`/conocimiento/${article.slug}`}
                  className="text-sm font-medium text-primary hover:underline"
                >
                  {t("readArticle")}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
