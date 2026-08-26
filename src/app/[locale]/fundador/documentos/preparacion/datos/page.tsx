import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { DocumentCompanySetup } from "@/components/founder/document-company-setup";
import { getOrCreateProfile } from "@/lib/auth/profile";

export default async function FounderDocumentSetupPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/iniciar-sesion?redirect_url=/fundador/documentos/preparacion/datos");
  }

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  return (
    <AppShell variant="founder">
      <DocumentCompanySetup />
    </AppShell>
  );
}
