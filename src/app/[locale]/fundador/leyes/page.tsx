import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { LegalCorpusCatalog } from "@/components/legal-corpus/legal-corpus-catalog";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { listLegalSourcesForLocale } from "@/lib/legal-corpus/service";
import type { LegalSourceType } from "@/lib/legal-corpus";

export default async function FounderLegalLibraryPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/leyes");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  const t = await getTranslations("founder.legalLibrary");
  const sources = await listLegalSourcesForLocale();

  const typeLabels = {
    constitution: t("sourceTypes.constitution"),
    code: t("sourceTypes.code"),
    statute: t("sourceTypes.statute"),
    decree: t("sourceTypes.decree"),
    circular: t("sourceTypes.circular"),
    decision: t("sourceTypes.decision"),
  } satisfies Record<LegalSourceType, string>;

  return (
    <AppShell variant="founder">
      <div className="flex min-h-0 flex-1 flex-col space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <LegalCorpusCatalog
          sources={sources}
          typeLabels={typeLabels}
          readLabel={t("readSource")}
          articleCountLabel={(count) => t("articleCount", { count })}
        />
        <p className="text-xs leading-relaxed text-muted-foreground">{t("disclaimer")}</p>
      </div>
    </AppShell>
  );
}
