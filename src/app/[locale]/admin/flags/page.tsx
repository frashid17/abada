import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FeatureFlagsPanel } from "@/components/admin/feature-flags-panel";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listFeatureFlagOverrides } from "@/lib/platform-admin/ops-cms";

export default async function AdminFlagsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/flags");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.flags");
  const overrides = await listFeatureFlagOverrides();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <FeatureFlagsPanel overrides={overrides} />
      </div>
    </AppShell>
  );
}
