"use client";

import { useRef, useState, useTransition } from "react";
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
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function FirmTemplatesPanel({
  templates,
  clauses,
  canEdit = true,
}: {
  templates: FirmTemplateRow[];
  clauses: FirmClauseRow[];
  canEdit?: boolean;
}) {
  const t = useTranslations("firm.templates");
  const router = useRouter();
  const templateFormRef = useRef<HTMLFormElement>(null);
  const clauseFormRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [templateForm, setTemplateForm] = useState<{
    id: string;
    slug: string;
    name: string;
    body: string;
  }>({
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

  function openTemplate(row: FirmTemplateRow) {
    setTemplateForm({
      id: row.id,
      slug: row.slug,
      name: row.name,
      body: row.body,
    });
    setError(null);
    templateFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function openClause(row: FirmClauseRow) {
    setClauseForm({
      id: row.id,
      slug: row.slug,
      name: row.name,
      body: row.body,
      notes: row.notes ?? "",
    });
    setError(null);
    clauseFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function submitTemplate(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setError(null);
    const fd = new FormData();
    if (templateForm.id) fd.set("id", templateForm.id);
    fd.set("slug", templateForm.slug);
    fd.set("name", templateForm.name);
    fd.set("body", templateForm.body);
    startTransition(async () => {
      const result = await upsertFirmTemplateAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setTemplateForm({ id: "", slug: INVESTMENT_DOCUMENT_TYPES[0], name: "", body: "" });
      router.refresh();
    });
  }

  function submitClause(event: React.FormEvent) {
    event.preventDefault();
    if (!canEdit) return;
    setError(null);
    const fd = new FormData();
    if (clauseForm.id) fd.set("id", clauseForm.id);
    fd.set("slug", clauseForm.slug);
    fd.set("name", clauseForm.name);
    fd.set("body", clauseForm.body);
    fd.set("notes", clauseForm.notes);
    startTransition(async () => {
      const result = await upsertFirmClauseAction(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setClauseForm({ id: "", slug: "", name: "", body: "", notes: "" });
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {!canEdit ? (
        <p className="rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground">
          {t("readOnly")}
        </p>
      ) : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid gap-10 lg:grid-cols-2">
        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{t("templatesTitle")}</h2>
          {canEdit ? (
            <form ref={templateFormRef} onSubmit={submitTemplate} className="space-y-3 rounded-xl border border-border bg-card p-4">
              {templateForm.id ? (
                <p className="text-xs font-medium text-primary">{t("editingTemplate")}</p>
              ) : null}
              <div className="space-y-2">
                <Label>{t("slug")}</Label>
                <Select
                  value={templateForm.slug}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, slug: e.target.value }))}
                >
                  {INVESTMENT_DOCUMENT_TYPES.map((slug) => (
                    <option key={slug} value={slug}>
                      {slug}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("body")}</Label>
                <Textarea
                  rows={10}
                  value={templateForm.body}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="cta" disabled={pending}>
                  {t("save")}
                </Button>
                {templateForm.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      setTemplateForm({
                        id: "",
                        slug: INVESTMENT_DOCUMENT_TYPES[0],
                        name: "",
                        body: "",
                      })
                    }
                  >
                    {t("cancelEdit")}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
          <div className="divide-y divide-border rounded-xl border border-border">
            {templates.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("emptyTemplates")}</p>
            ) : (
              templates.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer rounded-md px-1 py-1 text-left text-sm hover:bg-muted/50"
                    onClick={() => openTemplate(row)}
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-muted-foreground">{row.slug}</span>
                    <span className="mt-0.5 block text-[11px] text-primary">{t("open")}</span>
                  </button>
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteFirmTemplateAction(row.id);
                          if (!result.ok) setError(result.error);
                          else router.refresh();
                        })
                      }
                    >
                      {t("delete")}
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{t("clausesTitle")}</h2>
          {canEdit ? (
            <form ref={clauseFormRef} onSubmit={submitClause} className="space-y-3 rounded-xl border border-border bg-card p-4">
              {clauseForm.id ? (
                <p className="text-xs font-medium text-primary">{t("editingClause")}</p>
              ) : null}
              <div className="space-y-2">
                <Label>{t("slug")}</Label>
                <Input
                  value={clauseForm.slug}
                  onChange={(e) => setClauseForm((f) => ({ ...f, slug: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("name")}</Label>
                <Input
                  value={clauseForm.name}
                  onChange={(e) => setClauseForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>{t("body")}</Label>
                <Textarea
                  rows={8}
                  value={clauseForm.body}
                  onChange={(e) => setClauseForm((f) => ({ ...f, body: e.target.value }))}
                  required
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="submit" variant="cta" disabled={pending}>
                  {t("save")}
                </Button>
                {clauseForm.id ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      setClauseForm({ id: "", slug: "", name: "", body: "", notes: "" })
                    }
                  >
                    {t("cancelEdit")}
                  </Button>
                ) : null}
              </div>
            </form>
          ) : null}
          <div className="divide-y divide-border rounded-xl border border-border">
            {clauses.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("emptyClauses")}</p>
            ) : (
              clauses.map((row) => (
                <div key={row.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <button
                    type="button"
                    className="min-w-0 flex-1 cursor-pointer rounded-md px-1 py-1 text-left text-sm hover:bg-muted/50"
                    onClick={() => openClause(row)}
                  >
                    <span className="font-medium">{row.name}</span>
                    <span className="block text-muted-foreground">{row.slug}</span>
                    <span className="mt-0.5 block text-[11px] text-primary">{t("open")}</span>
                  </button>
                  {canEdit ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={pending}
                      onClick={() =>
                        startTransition(async () => {
                          const result = await deleteFirmClauseAction(row.id);
                          if (!result.ok) setError(result.error);
                          else router.refresh();
                        })
                      }
                    >
                      {t("delete")}
                    </Button>
                  ) : null}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
