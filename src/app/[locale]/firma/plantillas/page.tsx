import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FirmTemplatesPanel } from "@/components/firm/firm-templates-panel";
import { listFirmClauses, listFirmTemplates } from "@/lib/firm/template-cms";
import { requireFirmAdmin } from "@/lib/firm/membership";

export default async function FirmTemplatesPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/firma/plantillas");

  try {
    await requireFirmAdmin();
  } catch {
    redirect("/firma");
  }

  const t = await getTranslations("firm.templates");
  const [templates, clauses] = await Promise.all([listFirmTemplates(), listFirmClauses()]);

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <FirmTemplatesPanel templates={templates} clauses={clauses} />
      </div>
    </AppShell>
  );
}
