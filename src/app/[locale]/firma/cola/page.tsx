import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewQueueList } from "@/components/firm/review-queue-list";
import { listFirmReviews } from "@/lib/firm/reviews";
import { requireFirmPageAccess } from "@/lib/firm/session";

export default async function FirmQueuePage() {
  await requireFirmPageAccess("/firma/cola");

  const t = await getTranslations("firm");
  const reviews = await listFirmReviews();

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("dashboard.eyebrow")}
          title={t("queue.title")}
          description={t("queue.subtitle")}
        />
        <ReviewQueueList reviews={reviews} />
      </div>
    </AppShell>
  );
}
