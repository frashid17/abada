import { auth } from "@clerk/nextjs/server";
import { getLocale, getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LegalSourceReader } from "@/components/legal-corpus/legal-source-reader";
import { getOrCreateProfile } from "@/lib/auth/profile";
import type { DocumentLocale } from "@/lib/documents/document-locale";
import { parseDocumentLocale } from "@/lib/documents/document-locale";
import { isLegalSourceId, LEGAL_LIBRARY_BASE_PATH } from "@/lib/legal-corpus/routes";
import { getLegalSourceMetadata } from "@/lib/legal-corpus/service";

export default async function FounderLegalSourcePage({
  params,
}: {
  params: Promise<{ sourceId: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/leyes");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const { sourceId } = await params;
  if (!isLegalSourceId(sourceId)) notFound();

  const locale = parseDocumentLocale(await getLocale()) as DocumentLocale;
  const detail = await getLegalSourceMetadata(sourceId, locale);
  if (!detail) notFound();

  const t = await getTranslations("founder.legalLibrary");

  return (
    <AppShell variant="founder">
      <div className="flex min-h-0 flex-1 flex-col space-y-6">
        <Link href={LEGAL_LIBRARY_BASE_PATH} className="text-sm font-medium text-primary hover:underline">
          {t("backToLibrary")}
        </Link>
        <PageHeader title={detail.title} description={detail.citation} />
        <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">{detail.description}</p>
        <LegalSourceReader
          sourceId={detail.id}
          locale={locale}
          initialChunkCount={detail.chunkCount}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </AppShell>
  );
}
