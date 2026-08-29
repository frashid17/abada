"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import Link from "next/link";
import {
  importDocumentSeedAction,
  publishDocumentPackAction,
} from "@/lib/platform-admin/cms-actions";
import type { AdminDocumentPackSummary } from "@/lib/platform-admin/document-cms";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function DocumentPackList({ packs }: { packs: AdminDocumentPackSummary[] }) {
  const t = useTranslations("admin.documents");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleImport() {
    setError(null);
    startTransition(async () => {
      const result = await importDocumentSeedAction();
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function handlePublish(packId: string) {
    setError(null);
    startTransition(async () => {
      const result = await publishDocumentPackAction(packId as "fundadores" | "incentivos" | "pi");
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="outline" onClick={handleImport} disabled={pending}>
          {t("importSeed")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/admin/documentos/globals">{t("editGlobals")}</Link>
        </Button>
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-3">
        {packs.map((pack) => (
          <Card key={pack.id} variant="elevated">
            <CardHeader>
              <CardTitle className="text-lg">{pack.titleEs}</CardTitle>
              <CardDescription>
                {pack.articleCount} {t("articles")} · {t(`status.${pack.status}`)}
                {pack.publishedRevision ? ` · rev ${pack.publishedRevision}` : ""}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm" variant="cta">
                <Link href={`/admin/documentos/${pack.id}`}>{t("editPack")}</Link>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() => handlePublish(pack.id)}
              >
                {t("publish")}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
