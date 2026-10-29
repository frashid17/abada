import { auth, currentUser } from "@clerk/nextjs/server";
import { getLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentReviewBeforeSign } from "@/components/founder/document-review-before-sign";
import { WithResolvedPrototypeContent } from "@/components/founder/with-resolved-prototype-content";
import { TermsAcceptanceGate } from "@/components/legal/terms-acceptance-gate";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getTermsGateProps } from "@/lib/legal/terms-gate";

export default async function FounderDocumentReviewPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/iniciar-sesion?redirect_url=/fundador/documentos/preparacion/revision");
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const locale = (await getLocale()) as "es-CO" | "en-US";
  const [user, termsGate] = await Promise.all([
    currentUser(),
    getTermsGateProps(userId, locale),
  ]);
  const respondentEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    "";

  return (
    <AppShell variant="founder">
      <TermsAcceptanceGate {...termsGate}>
        <WithResolvedPrototypeContent>
          <DocumentReviewBeforeSign respondentEmail={respondentEmail} />
        </WithResolvedPrototypeContent>
      </TermsAcceptanceGate>
    </AppShell>
  );
}
