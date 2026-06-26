import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FounderDashboard } from "@/components/founder/founder-dashboard";
import { getFounderDashboard } from "@/lib/documents/dashboard";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getActiveSession } from "@/lib/auth/session";

export default async function FounderDashboardPage() {
  const { userId } = await getActiveSession();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const dashboard = await getFounderDashboard();

  return (
    <AppShell variant="founder">
      <FounderDashboard data={dashboard} />
    </AppShell>
  );
}
