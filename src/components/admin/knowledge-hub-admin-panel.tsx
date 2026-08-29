"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  deleteKnowledgeArticleAction,
  upsertKnowledgeArticleAction,
} from "@/lib/platform-admin/cms-actions";
import type { AdminKnowledgeArticle } from "@/lib/platform-admin/ops-cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function KnowledgeHubAdminPanel({
  articles,
  tenantId,
}: {
  articles: AdminKnowledgeArticle[];
  tenantId: string;
}) {
  const t = useTranslations("admin.knowledge");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState({
    id: "",
    slug: "",
    title: "",
    excerpt: "",
    body: "",
    status: "draft" as "draft" | "published" | "archived",
  });

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const fd = new FormData();
    if (form.id) fd.set("id", form.id);
    fd.set("tenantId", tenantId);
    fd.set("slug", form.slug);
    fd.set("title", form.title);
    fd.set("excerpt", form.excerpt);
    fd.set("body", form.body);
    fd.set("status", form.status);
    startTransition(async () => {
      await upsertKnowledgeArticleAction(fd);
      setForm({ id: "", slug: "", title: "", excerpt: "", body: "", status: "draft" });
      router.refresh();
    });
  }

  function edit(article: AdminKnowledgeArticle) {
    setForm({
      id: article.id,
      slug: article.slug,
      title: article.title,
      excerpt: article.excerpt ?? "",
      body: article.body,
      status: article.status as "draft" | "published" | "archived",
    });
  }

  function remove(id: string) {
    startTransition(async () => {
      await deleteKnowledgeArticleAction(id);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label>{t("slug")}</Label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>{t("articleTitle")}</Label>
          <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>{t("excerpt")}</Label>
          <Input value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
        </div>
        <div className="space-y-2">
          <Label>{t("body")}</Label>
          <Textarea rows={10} value={form.body} onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))} />
        </div>
        <Button type="submit" variant="cta" disabled={pending}>
          {form.id ? t("update") : t("create")}
        </Button>
      </form>
      <div className="divide-y divide-border rounded-xl border border-border">
        {articles.map((article) => (
          <div key={article.id} className="flex items-start justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">{article.title}</p>
              <p className="text-sm text-muted-foreground">
                {article.slug} · {article.status}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" variant="outline" onClick={() => edit(article)}>
                {t("edit")}
              </Button>
              <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => remove(article.id)}>
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
