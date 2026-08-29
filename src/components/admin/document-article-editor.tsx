"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveArticleAction } from "@/lib/platform-admin/cms-actions";
import type { PrototypeArticle } from "@/lib/documents/prototype/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function DocumentArticleEditor({
  packId,
  article,
}: {
  packId: "fundadores" | "incentivos" | "pi";
  article: PrototypeArticle;
}) {
  const t = useTranslations("admin.documents");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    t_es: article.t_es,
    t_en: article.t_en,
    does_es: article.does_es,
    does_en: article.does_en,
    matters_es: article.matters_es,
    matters_en: article.matters_en,
    clauses: (article.cl ?? [])
      .map((block) => (typeof block === "string" ? block : block.h))
      .join("\n\n"),
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const clauses = form.clauses
      .split(/\n\n+/)
      .map((line) => line.trim())
      .filter(Boolean);

    startTransition(async () => {
      const result = await saveArticleAction(packId, article.id, {
        t_es: form.t_es,
        t_en: form.t_en,
        does_es: form.does_es,
        does_en: form.does_en,
        matters_es: form.matters_es,
        matters_en: form.matters_en,
        cl: clauses,
      });
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="t_es">{t("titleEs")}</Label>
          <Input
            id="t_es"
            value={form.t_es}
            onChange={(e) => setForm((f) => ({ ...f, t_es: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="t_en">{t("titleEn")}</Label>
          <Input
            id="t_en"
            value={form.t_en}
            onChange={(e) => setForm((f) => ({ ...f, t_en: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="does_es">{t("doesEs")}</Label>
          <Textarea
            id="does_es"
            rows={4}
            value={form.does_es}
            onChange={(e) => setForm((f) => ({ ...f, does_es: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="does_en">{t("doesEn")}</Label>
          <Textarea
            id="does_en"
            rows={4}
            value={form.does_en}
            onChange={(e) => setForm((f) => ({ ...f, does_en: e.target.value }))}
          />
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="matters_es">{t("mattersEs")}</Label>
          <Textarea
            id="matters_es"
            rows={4}
            value={form.matters_es}
            onChange={(e) => setForm((f) => ({ ...f, matters_es: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="matters_en">{t("mattersEn")}</Label>
          <Textarea
            id="matters_en"
            rows={4}
            value={form.matters_en}
            onChange={(e) => setForm((f) => ({ ...f, matters_en: e.target.value }))}
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="clauses">{t("clauses")}</Label>
        <Textarea
          id="clauses"
          rows={12}
          value={form.clauses}
          onChange={(e) => setForm((f) => ({ ...f, clauses: e.target.value }))}
        />
        <p className="text-xs text-muted-foreground">{t("clausesHint")}</p>
      </div>
      <Button type="submit" variant="cta" disabled={pending}>
        {t("save")}
      </Button>
    </form>
  );
}
