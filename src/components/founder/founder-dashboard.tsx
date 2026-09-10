import { FounderDashboardBody } from "@/components/founder/founder-dashboard-body";
import { PrototypeContentProvider } from "@/components/founder/prototype-content-provider";
import { getResolvedPrototypeContent } from "@/lib/documents/prototype/resolve-content";

export async function FounderDashboard() {
  const content = await getResolvedPrototypeContent();

  return (
    <PrototypeContentProvider content={content}>
      <FounderDashboardBody />
    </PrototypeContentProvider>
  );
}
