"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import {
  importTemplateSeedAction,
  publishTemplateAction,
  saveTemplateDraftAction,
} from "@/lib/platform-admin/cms-actions";
import type { AdminTemplateSummary } from "@/lib/platform-admin/template-cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function TemplateList({ templates }: { templates: AdminTemplateSummary[] }) {
  const t = useTranslations("admin.templates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleImport() {
    startTransition(async () => {
      await importTemplateSeedAction();
      router.refresh();
    });
  }

  const slugs = [...new Set(templates.map((item) => item.slug))];

  return (
    <div className="space-y-6">
      <Button type="button" variant="outline" onClick={handleImport} disabled={pending}>
        {t("importSeed")}
      </Button>
      <div className="grid gap-4 md:grid-cols-2">
        {slugs.map((slug) => (
          <Card key={slug} variant="elevated">
            <CardHeader>
              <CardTitle>{slug}</CardTitle>
              <CardDescription>
                {templates
                  .filter((item) => item.slug === slug)
                  .map((item) => `${item.locale}: ${t(`status.${item.status}`)}`)
                  .join(" · ")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild size="sm" variant="cta">
                <Link href={`/admin/plantillas/${slug}`}>{t("edit")}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function TemplateEditor({
  slug,
  locale,
  initialBody,
}: {
  slug: AdminTemplateSummary["slug"];
  locale: "es" | "en";
  initialBody: string;
}) {
  const t = useTranslations("admin.templates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [body, setBody] = useState(initialBody);
  const [error, setError] = useState<string | null>(null);

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await saveTemplateDraftAction(slug, locale, body);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function handlePublish() {
    setError(null);
    startTransition(async () => {
      const save = await saveTemplateDraftAction(slug, locale, body);
      if (!save.ok) {
        setError(save.error);
        return;
      }
      const result = await publishTemplateAction(slug, locale);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-2">
        <Label>{t("body")}</Label>
        <Textarea rows={24} value={body} onChange={(e) => setBody(e.target.value)} className="font-mono text-sm" />
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="cta" disabled={pending} onClick={handleSave}>
          {t("save")}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={handlePublish}>
          {t("publish")}
        </Button>
      </div>
    </div>
  );
}
