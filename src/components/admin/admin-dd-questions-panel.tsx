"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  deleteDdQuestionAction,
  seedDdQuestionsAction,
  setDdQuestionStatusAction,
  upsertDdQuestionAction,
} from "@/lib/dd/questionnaire-actions";
import type { AdminDdQuestion } from "@/lib/dd/questionnaire-cms";
import { DD_RISK_CATEGORIES, DD_RISK_LEVELS } from "@/lib/dd/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const SECTIONS = ["fundadores", "incentivos", "pi", "declaration", "cross"] as const;

const emptyForm = {
  id: "",
  slug: "",
  sectionKey: "fundadores",
  sortOrder: "0",
  qEs: "",
  qEn: "",
  hintEs: "",
  hintEn: "",
  answerType: "yes_no",
  riskCategory: "corporativo_registral",
  riskLevelIfGap: "info_requerida",
  findingEs: "",
  findingEn: "",
  actionEs: "",
  actionEn: "",
  status: "draft",
};

export function AdminDdQuestionsPanel({ questions }: { questions: AdminDdQuestion[] }) {
  const t = useTranslations("admin.diligence");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  function loadQuestion(row: AdminDdQuestion) {
    setForm({
      id: row.id,
      slug: row.slug,
      sectionKey: row.sectionKey,
      sortOrder: String(row.sortOrder),
      qEs: row.qEs,
      qEn: row.qEn,
      hintEs: row.hintEs ?? "",
      hintEn: row.hintEn ?? "",
      answerType: row.answerType,
      riskCategory: row.riskCategory,
      riskLevelIfGap: row.riskLevelIfGap,
      findingEs: row.findingEs,
      findingEn: row.findingEn,
      actionEs: row.actionEs ?? "",
      actionEn: row.actionEn ?? "",
      status: row.status,
    });
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const fd = new FormData();
    for (const [key, value] of Object.entries(form)) {
      if (key === "id" && !value) continue;
      fd.set(key, value);
    }
    startTransition(async () => {
      await upsertDdQuestionAction(fd);
      setForm(emptyForm);
      setMessage(t("saved"));
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="cta"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await seedDdQuestionsAction();
              setMessage(t("seeded", { count: result.inserted }));
              router.refresh();
            })
          }
        >
          {t("seed")}
        </Button>
        <Button type="button" variant="outline" disabled={pending} onClick={() => setForm(emptyForm)}>
          {t("newQuestion")}
        </Button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <form onSubmit={submit} className="grid gap-4 rounded-xl border border-border bg-card p-4 lg:grid-cols-2">
        <div className="space-y-2">
          <Label>{t("slug")}</Label>
          <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label>{t("section")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.sectionKey}
            onChange={(e) => setForm((f) => ({ ...f, sectionKey: e.target.value }))}
          >
            {SECTIONS.map((section) => (
              <option key={section} value={section}>
                {t(`sections.${section}`)}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>{t("qEs")}</Label>
          <Textarea rows={2} value={form.qEs} onChange={(e) => setForm((f) => ({ ...f, qEs: e.target.value }))} required />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>{t("qEn")}</Label>
          <Textarea rows={2} value={form.qEn} onChange={(e) => setForm((f) => ({ ...f, qEn: e.target.value }))} required />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>{t("findingEs")}</Label>
          <Textarea rows={2} value={form.findingEs} onChange={(e) => setForm((f) => ({ ...f, findingEs: e.target.value }))} required />
        </div>
        <div className="space-y-2 lg:col-span-2">
          <Label>{t("findingEn")}</Label>
          <Textarea rows={2} value={form.findingEn} onChange={(e) => setForm((f) => ({ ...f, findingEn: e.target.value }))} required />
        </div>
        <div className="space-y-2">
          <Label>{t("answerType")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.answerType}
            onChange={(e) => setForm((f) => ({ ...f, answerType: e.target.value }))}
          >
            <option value="yes_no">yes_no</option>
            <option value="yes_no_na">yes_no_na</option>
            <option value="text">text</option>
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("sortOrder")}</Label>
          <Input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: e.target.value }))}
          />
        </div>
        <div className="space-y-2">
          <Label>{t("riskCategory")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.riskCategory}
            onChange={(e) => setForm((f) => ({ ...f, riskCategory: e.target.value }))}
          >
            {DD_RISK_CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("riskLevel")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.riskLevelIfGap}
            onChange={(e) => setForm((f) => ({ ...f, riskLevelIfGap: e.target.value }))}
          >
            {DD_RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <Label>{t("status")}</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={form.status}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
          >
            <option value="draft">draft</option>
            <option value="published">published</option>
          </select>
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="cta" disabled={pending}>
            {form.id ? t("update") : t("create")}
          </Button>
        </div>
      </form>

      <div className="divide-y divide-border rounded-xl border border-border">
        {questions.map((row) => (
          <div key={row.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
            <button type="button" className="text-left" onClick={() => loadQuestion(row)}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {t(`sections.${row.sectionKey}`)} · {row.status}
              </p>
              <p className="font-medium">{row.qEs}</p>
              <p className="text-sm text-muted-foreground">{row.slug}</p>
            </button>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await setDdQuestionStatusAction(
                      row.id,
                      row.status === "published" ? "draft" : "published",
                    );
                    router.refresh();
                  })
                }
              >
                {row.status === "published" ? t("unpublish") : t("publish")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await deleteDdQuestionAction(row.id);
                    router.refresh();
                  })
                }
              >
                {t("delete")}
              </Button>
            </div>
          </div>
        ))}
        {questions.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("empty")}</p>
        ) : null}
      </div>
    </div>
  );
}
