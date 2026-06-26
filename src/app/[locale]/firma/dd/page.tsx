import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { DealList } from "@/components/dd/deal-list";
import { CreateDealForm } from "@/components/firm/create-deal-form";
import { listFirmDeals } from "@/lib/firm/deals";
import { listKnownFoundersForFirm } from "@/lib/firm/founder-lookup";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { requireFirmPageAccess } from "@/lib/firm/session";
import { auth } from "@clerk/nextjs/server";

export default async function FirmDdPage() {
  await requireFirmPageAccess("/firma/dd");

  const t = await getTranslations("firm.dd");
  const deals = await listFirmDeals();
  const { userId } = await auth();
  const membership = userId ? await getFirmMembershipForUser(userId) : null;
  const knownFounders = membership ? await listKnownFoundersForFirm(membership.tenantId) : [];

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("subtitle")}
        />
        <CreateDealForm knownFounders={knownFounders} />
        <DealList deals={deals} basePath="/firma/dd" emptyKey="firm.dd.empty" />
      </div>
    </AppShell>
  );
}
