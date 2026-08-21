import { redirect } from "next/navigation";

export default async function FounderSalaDocumentationDocRedirect({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType } = await params;
  redirect(`/fundador/documentos/guia/${docType}`);
}
