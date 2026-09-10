import { FounderDashboardBody } from "@/components/founder/founder-dashboard-body";
import { WithResolvedPrototypeContent } from "@/components/founder/with-resolved-prototype-content";

export async function FounderDashboard() {
  return (
    <WithResolvedPrototypeContent>
      <FounderDashboardBody />
    </WithResolvedPrototypeContent>
  );
}
