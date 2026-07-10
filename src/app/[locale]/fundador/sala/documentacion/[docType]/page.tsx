import { redirect } from "next/navigation";

export default async function FounderDocumentationLegacyRoute({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType } = await params;
  redirect(`/fundador/plantillas/${docType}`);
}
