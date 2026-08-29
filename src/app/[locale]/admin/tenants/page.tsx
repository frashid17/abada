import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminTenants } from "@/lib/platform-admin/ops-cms";

export default async function AdminTenantsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/tenants");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.tenants");
  const tenants = await listAdminTenants();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <div className="divide-y divide-border rounded-xl border border-border bg-card">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div>
                <p className="font-medium">{tenant.name}</p>
                <p className="text-sm text-muted-foreground">{tenant.id}</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {tenant.memberCount} {t("members")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
