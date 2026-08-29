import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentReviewBeforeSign } from "@/components/founder/document-review-before-sign";
import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getResolvedPrototypeContent } from "@/lib/documents/prototype/resolve-content";

export default async function FounderDocumentReviewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/iniciar-sesion?redirect_url=/fundador/documentos/preparacion/revision");
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const content = await getResolvedPrototypeContent();

  return (
    <AppShell variant="founder">
      <PrototypeContentProvider content={content}>
        <DocumentReviewBeforeSign />
      </PrototypeContentProvider>
    </AppShell>
  );
}
