import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FounderDocumentsPageContent } from "@/components/founder/founder-documents-page";
import { getFounderDashboard } from "@/lib/documents/dashboard";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getActiveSession } from "@/lib/auth/session";

export default async function FounderDocumentsPage() {
  const { userId } = await getActiveSession();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/documentos");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const dashboard = await getFounderDashboard();

  return (
    <AppShell variant="founder">
      <FounderDocumentsPageContent data={dashboard} />
    </AppShell>
  );
}
