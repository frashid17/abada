import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getPublishedKnowledgeArticle } from "@/lib/knowledge-hub/service";
import { resolveAppShellVariant } from "@/lib/layout/shell-variant";

export default async function KnowledgeHubArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getPublishedKnowledgeArticle(slug);
  if (!article) notFound();

  const t = await getTranslations("knowledgeHub");
  const shellVariant = await resolveAppShellVariant();

  return (
    <AppShell variant={shellVariant}>
      <article className="mx-auto max-w-3xl space-y-8">
        <Link href="/conocimiento" className="text-sm font-medium text-primary hover:underline">
          {t("backToHub")}
        </Link>
        <PageHeader title={article.title} description={article.excerpt ?? undefined} />
        <div className="prose prose-neutral max-w-none dark:prose-invert">
          {article.body.split("\n\n").map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="text-base leading-relaxed text-foreground">
              {paragraph}
            </p>
          ))}
        </div>
      </article>
    </AppShell>
  );
}
