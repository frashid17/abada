import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { UsageAnalyticsDashboard } from "@/components/admin/usage-analytics-dashboard";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getUsageAnalyticsSummary } from "@/lib/platform-admin/usage-analytics";

export default async function AdminAnalyticsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/analytics");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.analytics");
  const summary = await getUsageAnalyticsSummary();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <UsageAnalyticsDashboard summary={summary} />
      </div>
    </AppShell>
  );
}
