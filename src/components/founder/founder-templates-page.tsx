import { getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { DocumentLearnView } from "@/components/founder/document-learn-view";
import { FounderDocumentationTabs } from "@/components/founder/founder-documentation-tabs";
import { getLearnDocument } from "@/lib/documents/learn/get-learn-document";
import { learnSlugToType } from "@/lib/documents/learn/routes";
import type { DocumentLocale } from "@/lib/documents/document-locale";

type FounderTemplatesPageProps = {
  params: Promise<{ docType: string }>;
};

export async function FounderTemplatesPage({ params }: FounderTemplatesPageProps) {
  const { docType: slug } = await params;
  const documentType = learnSlugToType(slug);
  if (!documentType) notFound();

  const locale = (await getLocale()) as DocumentLocale;
  const payload = await getLearnDocument(documentType, locale);

  return (
    <div className="-mx-4 space-y-0 sm:-mx-6">
      <div className="sticky top-14 z-30 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur-sm sm:top-16 sm:px-6">
        <FounderDocumentationTabs activeDocument={documentType} />
      </div>
      <DocumentLearnView payload={payload} layout="fullscreen" />
    </div>
  );
}
