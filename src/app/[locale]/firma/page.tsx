import { AppShell } from "@/components/layout/app-shell";
import { FirmDashboard } from "@/components/firm/firm-dashboard";
import { getFirmDashboardData } from "@/lib/firm/dashboard";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { requireFirmPageAccess } from "@/lib/firm/session";

export default async function FirmDashboardPage() {
  const session = await requireFirmPageAccess("/firma");
  const dashboard = await getFirmDashboardData({
    tenantId: session.tenantId,
    tenantName: session.tenantName,
    role: session.role as FirmMemberRole,
  });

  return (
    <AppShell variant="firm">
      <FirmDashboard data={dashboard} />
    </AppShell>
  );
}
