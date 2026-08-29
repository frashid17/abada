import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentArticleReader } from "@/components/founder/document-article-reader";
import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { isPrototypeDocId } from "@/lib/documents/prototype/catalog";
import { getResolvedPrototypeContent } from "@/lib/documents/prototype/resolve-content";

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

  const initialIndex = Number.parseInt(art ?? "0", 10);
  const content = await getResolvedPrototypeContent();

  return (
    <AppShell variant="founder">
      <PrototypeContentProvider content={content}>
        <DocumentArticleReader
          docId={docSlug}
          initialIndex={Number.isFinite(initialIndex) ? initialIndex : 0}
        />
      </PrototypeContentProvider>
    </AppShell>
  );
}
