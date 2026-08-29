import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentArticleReader } from "@/components/founder/document-article-reader";
import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { getOrCreateProfile } from "@/lib/auth/profile";
import {
  flattenPrototypeArticles,
  isPrototypeDocId,
} from "@/lib/documents/prototype/catalog";
import { getResolvedPrototypeContent } from "@/lib/documents/prototype/resolve-content";

function resolveArticleIndex(
  art: string | undefined,
  articles: ReturnType<typeof flattenPrototypeArticles>,
): number {
  if (!art || articles.length === 0) return 0;
  const byId = articles.findIndex((article) => article.id === art);
  if (byId >= 0) return byId;
  const byNumber = Number.parseInt(art, 10);
  if (Number.isFinite(byNumber)) {
    return Math.min(Math.max(byNumber, 0), articles.length - 1);
  }
  return 0;
}

export default async function FounderDocumentPreparationPage({
  params,
  searchParams,
}: {
  params: Promise<{ docSlug: string }>;
  searchParams: Promise<{ art?: string }>;
}) {
  const { docSlug } = await params;
  const { art } = await searchParams;
  if (!isPrototypeDocId(docSlug)) notFound();

  const { userId } = await auth();
  if (!userId) {
    redirect(`/iniciar-sesion?redirect_url=/fundador/documentos/preparacion/${docSlug}`);
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const content = await getResolvedPrototypeContent();
  const articles = flattenPrototypeArticles(docSlug, content);
  const initialIndex = resolveArticleIndex(art, articles);

  return (
    <AppShell variant="founder">
      <PrototypeContentProvider content={content}>
        <DocumentArticleReader docId={docSlug} initialIndex={initialIndex} />
      </PrototypeContentProvider>
    </AppShell>
  );
}
