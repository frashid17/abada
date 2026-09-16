import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentReviewBeforeSign } from "@/components/founder/document-review-before-sign";
import { WithResolvedPrototypeContent } from "@/components/founder/with-resolved-prototype-content";
import { getOrCreateProfile } from "@/lib/auth/profile";

export default async function FounderDocumentReviewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/iniciar-sesion?redirect_url=/fundador/documentos/preparacion/revision");
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const user = await currentUser();
  const respondentEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  return (
    <AppShell variant="founder">
      <WithResolvedPrototypeContent>
        <DocumentReviewBeforeSign respondentEmail={respondentEmail} />
      </WithResolvedPrototypeContent>
    </AppShell>
  );
}
