import { redirect } from "next/navigation";
import { learnSlugToType, templatesPath } from "@/lib/documents/learn/routes";

export default async function FounderTemplatesLegacyRoute({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType: slug } = await params;
  const documentType = learnSlugToType(slug);
  if (documentType) {
    redirect(templatesPath(documentType));
  }
  redirect("/fundador/documentos/guia/term-sheet");
}
