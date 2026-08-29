"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  deleteFirmClauseAction,
  deleteFirmTemplateAction,
  upsertFirmClauseAction,
  upsertFirmTemplateAction,
} from "@/lib/platform-admin/cms-actions";
import type { FirmClauseRow, FirmTemplateRow } from "@/lib/firm/template-cms";
import { INVESTMENT_DOCUMENT_TYPES } from "@/lib/documents/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function FirmTemplatesPanel({
  templates,
  clauses,
}: {
  templates: FirmTemplateRow[];
  clauses: FirmClauseRow[];
}) {
  const t = useTranslations("firm.templates");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [templateForm, setTemplateForm] = useState({
    id: "",
    slug: INVESTMENT_DOCUMENT_TYPES[0],
    name: "",
    body: "",
  });
  const [clauseForm, setClauseForm] = useState({
    id: "",
    slug: "",
    name: "",
    body: "",
    notes: "",
  });

  function submitTemplate(event: React.FormEvent) {
    event.preventDefault();
    const fd = new FormData();
    if (templateForm.id) fd.set("id", templateForm.id);
    fd.set("slug", templateForm.slug);
    fd.set("name", templateForm.name);
    fd.set("body", templateForm.body);
    startTransition(async () => {
      await upsertFirmTemplateAction(fd);
      setTemplateForm({ id: "", slug: INVESTMENT_DOCUMENT_TYPES[0], name: "", body: "" });
      router.refresh();
    });
  }

  function submitClause(event: React.FormEvent) {
    event.preventDefault();
    const fd = new FormData();
    if (clauseForm.id) fd.set("id", clauseForm.id);
    fd.set("slug", clauseForm.slug);
    fd.set("name", clauseForm.name);
    fd.set("body", clauseForm.body);
    fd.set("notes", clauseForm.notes);
    startTransition(async () => {
      await upsertFirmClauseAction(fd);
      setClauseForm({ id: "", slug: "", name: "", body: "", notes: "" });
      router.refresh();
    });
  }

  return (
    <div className="grid gap-10 lg:grid-cols-2">
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">{t("templatesTitle")}</h2>
        <form onSubmit={submitTemplate} className="space-y-3">
          <div className="space-y-2">
            <Label>{t("slug")}</Label>
            <Input
              value={templateForm.slug}
              onChange={(e) => setTemplateForm((f) => ({ ...f, slug: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input
              value={templateForm.name}
              onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("body")}</Label>
            <Textarea
              rows={10}
              value={templateForm.body}
              onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
            />
          </div>
          <Button type="submit" variant="cta" disabled={pending}>
            {t("save")}
          </Button>
        </form>
        <div className="divide-y divide-border rounded-xl border border-border">
          {templates.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <button
                type="button"
                className="text-left text-sm"
                onClick={() =>
                  setTemplateForm({
                    id: row.id,
                    slug: row.slug,
                    name: row.name,
                    body: row.body,
                  })
                }
              >
                <span className="font-medium">{row.name}</span>
                <span className="block text-muted-foreground">{row.slug}</span>
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteFirmTemplateAction(row.id);
                    router.refresh();
                  })
                }
              >
                {t("delete")}
              </Button>
            </div>
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <h2 className="font-serif text-xl font-semibold">{t("clausesTitle")}</h2>
        <form onSubmit={submitClause} className="space-y-3">
          <div className="space-y-2">
            <Label>{t("slug")}</Label>
            <Input value={clauseForm.slug} onChange={(e) => setClauseForm((f) => ({ ...f, slug: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("name")}</Label>
            <Input value={clauseForm.name} onChange={(e) => setClauseForm((f) => ({ ...f, name: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label>{t("body")}</Label>
            <Textarea rows={8} value={clauseForm.body} onChange={(e) => setClauseForm((f) => ({ ...f, body: e.target.value }))} />
          </div>
          <Button type="submit" variant="cta" disabled={pending}>
            {t("save")}
          </Button>
        </form>
        <div className="divide-y divide-border rounded-xl border border-border">
          {clauses.map((row) => (
            <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
              <button
                type="button"
                className="text-left text-sm"
                onClick={() =>
                  setClauseForm({
                    id: row.id,
                    slug: row.slug,
                    name: row.name,
                    body: row.body,
                    notes: row.notes ?? "",
                  })
                }
              >
                <span className="font-medium">{row.name}</span>
                <span className="block text-muted-foreground">{row.slug}</span>
              </button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteFirmClauseAction(row.id);
                    router.refresh();
                  })
                }
              >
                {t("delete")}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
