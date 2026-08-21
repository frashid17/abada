import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FounderTemplatesPage } from "@/components/founder/founder-templates-page";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { learnSlugToType, templatesPath } from "@/lib/documents/learn/routes";

export default async function FounderDocumentGuideRoute({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { docType: slug } = await params;
  const documentType = learnSlugToType(slug);

  if (documentType === "shareholders" || documentType === "employment") {
    redirect(templatesPath(documentType));
  }

  const { userId } = await auth();
  if (!userId) {
    redirect(`/iniciar-sesion?redirect_url=/fundador/documentos/guia/${slug}`);
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  return (
    <AppShell variant="founder">
      <FounderTemplatesPage params={params} />
    </AppShell>
  );
}
