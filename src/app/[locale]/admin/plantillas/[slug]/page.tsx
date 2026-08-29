import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { TemplateEditor } from "@/components/admin/template-editor";
import { Button } from "@/components/ui/button";
import { INVESTMENT_DOCUMENT_TYPES } from "@/lib/documents/catalog";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getAdminTemplateDraft } from "@/lib/platform-admin/template-cms";

export default async function AdminTemplateEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ locale?: string }>;
}) {
  const { slug } = await params;
  const { locale: localeParam } = await searchParams;
  if (!INVESTMENT_DOCUMENT_TYPES.includes(slug as (typeof INVESTMENT_DOCUMENT_TYPES)[number])) {
    notFound();
  }

  const locale = localeParam === "en" ? "en" : "es";

  const { userId } = await auth();
  if (!userId) redirect(`/iniciar-sesion?redirect_url=/admin/plantillas/${slug}`);
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.templates");
  const body = await getAdminTemplateDraft(
    slug as (typeof INVESTMENT_DOCUMENT_TYPES)[number],
    locale,
  );

  return (
    <AppShell variant="admin">
      <div className="mx-auto max-w-4xl space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <PageHeader eyebrow={t("eyebrow")} title={slug} description={locale === "en" ? "English" : "Español"} />
          <div className="flex gap-2">
            <Button asChild variant={locale === "es" ? "cta" : "outline"} size="sm">
              <Link href={`/admin/plantillas/${slug}?locale=es`}>ES</Link>
            </Button>
            <Button asChild variant={locale === "en" ? "cta" : "outline"} size="sm">
              <Link href={`/admin/plantillas/${slug}?locale=en`}>EN</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/plantillas">{t("back")}</Link>
            </Button>
          </div>
        </div>
        <TemplateEditor
          slug={slug as (typeof INVESTMENT_DOCUMENT_TYPES)[number]}
          locale={locale}
          initialBody={body}
        />
      </div>
    </AppShell>
  );
}
