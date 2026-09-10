import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FirmTemplatesPanel } from "@/components/firm/firm-templates-panel";
import { listFirmClauses, listFirmTemplates } from "@/lib/firm/template-cms";
import { isFirmAdminRole, type FirmMemberRole } from "@/lib/firm/membership";
import { requireFirmPageAccess } from "@/lib/firm/session";

export default async function FirmTemplatesPage() {
  const session = await requireFirmPageAccess("/firma/plantillas");
  const canEdit = isFirmAdminRole(session.role as FirmMemberRole);

  const t = await getTranslations("firm.templates");
  const [templates, clauses] = await Promise.all([listFirmTemplates(), listFirmClauses()]);

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <FirmTemplatesPanel templates={templates} clauses={clauses} canEdit={canEdit} />
      </div>
    </AppShell>
  );
}
