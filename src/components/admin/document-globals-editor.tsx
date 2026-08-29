"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { saveTokenAction } from "@/lib/platform-admin/cms-actions";
import type { PrototypeTokenMeta } from "@/lib/documents/prototype/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function DocumentGlobalsEditor({
  tokens,
}: {
  tokens: Record<string, PrototypeTokenMeta>;
}) {
  const t = useTranslations("admin.documents");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [selectedKey, setSelectedKey] = useState(Object.keys(tokens)[0] ?? "");
  const token = tokens[selectedKey];
  const [draft, setDraft] = useState<PrototypeTokenMeta | null>(token ?? null);

  function selectKey(key: string) {
    setSelectedKey(key);
    setDraft(tokens[key] ?? null);
  }

  function handleSave() {
    if (!selectedKey || !draft) return;
    setError(null);
    startTransition(async () => {
      const result = await saveTokenAction(selectedKey, draft);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  if (!draft) return null;

  return (
    <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
      <div className="space-y-1">
        {Object.keys(tokens).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => selectKey(key)}
            className={`block w-full rounded-md px-3 py-2 text-left text-sm ${
              key === selectedKey ? "bg-accent-soft font-medium" : "hover:bg-muted"
            }`}
          >
            {key}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>{t("labelEs")}</Label>
            <Input
              value={draft.es}
              onChange={(e) => setDraft({ ...draft, es: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("labelEn")}</Label>
            <Input
              value={draft.en}
              onChange={(e) => setDraft({ ...draft, en: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sampleEs")}</Label>
            <Input
              value={draft.sample_es ?? ""}
              onChange={(e) => setDraft({ ...draft, sample_es: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sampleEn")}</Label>
            <Input
              value={draft.sample_en ?? ""}
              onChange={(e) => setDraft({ ...draft, sample_en: e.target.value })}
            />
          </div>
        </div>
        <Button type="button" variant="cta" disabled={pending} onClick={handleSave}>
          {t("save")}
        </Button>
      </div>
    </div>
  );
}
