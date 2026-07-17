import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { UserCell } from "@/components/admin/user-cell";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { listAdminAiUsage } from "@/lib/platform-admin/service";

export default async function AdminAiPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/ai");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.ai");
  const rows = await listAdminAiUsage();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("when")}</th>
                  <th className="px-4 py-3 font-medium">{t("caller")}</th>
                  <th className="px-4 py-3 font-medium">{t("task")}</th>
                  <th className="px-4 py-3 font-medium">{t("model")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <UserCell name={row.callerName} email={row.callerEmail} />
                    </td>
                    <td className="px-4 py-3">{row.task}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.model}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
