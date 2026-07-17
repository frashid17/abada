import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { CorpusSourceForm } from "@/components/admin/corpus-source-form";
import { CorpusVisibilityToggle } from "@/components/admin/corpus-visibility-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isPlatformAdmin } from "@/lib/platform-admin/auth";
import { getAdminCorpusSource, listAdminCorpusSources } from "@/lib/platform-admin/service";

type PageProps = {
  searchParams: Promise<{ crear?: string; editar?: string }>;
};

export default async function AdminCorpusPage({ searchParams }: PageProps) {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/admin/corpus");
  if (!(await isPlatformAdmin(userId))) redirect("/");

  const t = await getTranslations("admin.corpus");
  const { crear, editar } = await searchParams;
  const showCreate = crear === "1" || crear === "true";

  if (editar) {
    const source = await getAdminCorpusSource(editar);
    if (!source) notFound();

    return (
      <AppShell variant="admin">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <PageHeader
              eyebrow={t("eyebrow")}
              title={t("form.editTitle")}
              description={t("form.editSubtitle", { citation: source.citationEs })}
            />
            <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
              <Link href="/admin/corpus">{t("form.cancel")}</Link>
            </Button>
          </div>
          <Card variant="elevated">
            <CardContent className="pt-6">
              <CorpusSourceForm mode="edit" source={source} />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  if (showCreate) {
    return (
      <AppShell variant="admin">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <PageHeader
              eyebrow={t("eyebrow")}
              title={t("form.createTitle")}
              description={t("form.createSubtitle")}
            />
            <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
              <Link href="/admin/corpus">{t("form.cancel")}</Link>
            </Button>
          </div>
          <Card variant="elevated">
            <CardContent className="pt-6">
              <CorpusSourceForm mode="create" />
            </CardContent>
          </Card>
        </div>
      </AppShell>
    );
  }

  const sources = await listAdminCorpusSources();

  return (
    <AppShell variant="admin">
      <div className="space-y-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
          <Button asChild variant="cta" className="shrink-0 self-start sm:self-auto">
            <Link href="/admin/corpus?crear=1">
              <Plus className="size-4" />
              {t("addLaw")}
            </Link>
          </Button>
        </div>

        {sources.length === 0 ? (
          <Card variant="elevated">
            <CardContent className="flex flex-col items-start gap-4 py-10">
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
              <Button asChild variant="cta">
                <Link href="/admin/corpus?crear=1">
                  <Plus className="size-4" />
                  {t("addLaw")}
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {sources.map((source) => (
              <Card key={source.id} variant="elevated">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div className="min-w-0 space-y-1">
                    <CardTitle className="text-base leading-snug">{source.titleEs}</CardTitle>
                    <CardDescription>{source.citationEs}</CardDescription>
                    <p className="text-xs text-muted-foreground">
                      {t("chunks", { count: source.chunkCount })} ·{" "}
                      {t("status", { status: source.status })} ·{" "}
                      {source.founderVisible ? t("visible") : t("hidden")}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/admin/corpus?editar=${encodeURIComponent(source.id)}`}>
                        <Pencil className="size-3.5" />
                        {t("edit")}
                      </Link>
                    </Button>
                    <CorpusVisibilityToggle
                      sourceId={source.id}
                      founderVisible={source.founderVisible}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{source.titleEn}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
