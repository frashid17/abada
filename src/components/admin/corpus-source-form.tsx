"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { FileText, Loader2, Upload } from "lucide-react";
import { upsertLegalSourceAction } from "@/lib/platform-admin/actions";
import type { AdminCorpusSource } from "@/lib/platform-admin/service";
import type { LegalSourceType } from "@/lib/legal-corpus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SOURCE_TYPES: LegalSourceType[] = [
  "constitution",
  "code",
  "statute",
  "decree",
  "circular",
  "decision",
];

type ContentMode = "paste" | "pdf";

type CorpusSourceFormProps = {
  mode: "create" | "edit";
  source?: AdminCorpusSource;
};

export function CorpusSourceForm({ mode, source }: CorpusSourceFormProps) {
  const t = useTranslations("admin.corpus");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [founderVisible, setFounderVisible] = useState(source?.founderVisible ?? true);
  const [contentMode, setContentMode] = useState<ContentMode>("paste");
  const [pdfName, setPdfName] = useState<string | null>(null);

  function resolveError(code: string): string {
    const known = [
      "REQUIRED_FIELDS",
      "INVALID_TYPE",
      "PDF_REQUIRED",
      "PDF_TOO_LARGE",
      "INVALID_PDF",
      "PDF_TOOLS_MISSING",
      "OCR_TOOLS_MISSING",
      "EXTRACT_EMPTY",
    ] as const;
    if ((known as readonly string[]).includes(code)) {
      return t(`form.errors.${code as (typeof known)[number]}`);
    }
    return code;
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus(null);
    const form = new FormData(e.currentTarget);
    form.set("contentMode", contentMode);
    form.set("founderVisible", founderVisible ? "true" : "false");
    if (mode === "edit" && source?.id) {
      form.set("id", source.id);
    }

    startTransition(async () => {
      if (contentMode === "pdf") {
        setStatus(t("form.extracting"));
      }

      const result = await upsertLegalSourceAction(form);

      if (!result.ok) {
        setStatus(null);
        setError(resolveError(result.error));
        return;
      }

      if (result.extractMethod === "ocr") {
        setStatus(t("form.extractedOcr", { count: result.chunkCount }));
      } else if (result.extractMethod === "text_layer") {
        setStatus(t("form.extractedText", { count: result.chunkCount }));
      }

      router.push("/admin/corpus");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6" encType="multipart/form-data">
      <div className="grid gap-4 sm:grid-cols-2">
        {mode === "create" ? (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="source-id">{t("form.idLabel")}</Label>
            <Input
              id="source-id"
              name="id"
              placeholder={t("form.idPlaceholder")}
              disabled={pending}
            />
            <p className="text-xs text-muted-foreground">{t("form.idHint")}</p>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="source-type">{t("form.typeLabel")}</Label>
          <Select
            id="source-type"
            name="sourceType"
            defaultValue={source?.sourceType ?? "statute"}
            disabled={pending}
            required
          >
            {SOURCE_TYPES.map((type) => (
              <option key={type} value={type}>
                {t(`types.${type}`)}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="citation-es">{t("form.citationEs")}</Label>
          <Input
            id="citation-es"
            name="citationEs"
            defaultValue={source?.citationEs}
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="citation-en">{t("form.citationEn")}</Label>
          <Input
            id="citation-en"
            name="citationEn"
            defaultValue={source?.citationEn}
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title-es">{t("form.titleEs")}</Label>
          <Input
            id="title-es"
            name="titleEs"
            defaultValue={source?.titleEs}
            required
            disabled={pending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="title-en">{t("form.titleEn")}</Label>
          <Input
            id="title-en"
            name="titleEn"
            defaultValue={source?.titleEn}
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description-es">{t("form.descriptionEs")}</Label>
          <Textarea
            id="description-es"
            name="descriptionEs"
            defaultValue={source?.descriptionEs}
            rows={3}
            disabled={pending}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description-en">{t("form.descriptionEn")}</Label>
          <Textarea
            id="description-en"
            name="descriptionEn"
            defaultValue={source?.descriptionEn}
            rows={3}
            disabled={pending}
          />
        </div>

        <div className="space-y-3 sm:col-span-2">
          <Label>{t("form.contentLabel")}</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={pending}
              onClick={() => setContentMode("paste")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                contentMode === "paste"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/60 hover:border-primary/30",
              )}
            >
              <FileText className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">{t("form.modePaste")}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("form.modePasteHint")}
                </span>
              </span>
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setContentMode("pdf")}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-left transition-colors",
                contentMode === "pdf"
                  ? "border-primary/50 bg-primary/5"
                  : "border-border/60 hover:border-primary/30",
              )}
            >
              <Upload className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                <span className="block text-sm font-medium">{t("form.modePdf")}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {t("form.modePdfHint")}
                </span>
              </span>
            </button>
          </div>

          {contentMode === "paste" ? (
            <div className="space-y-2">
              <Label htmlFor="pasted-text">{t("form.pastedText")}</Label>
              <Textarea
                id="pasted-text"
                name="pastedTextEs"
                rows={10}
                placeholder={t("form.pastedTextPlaceholder")}
                disabled={pending}
              />
              <p className="text-xs text-muted-foreground">{t("form.pastedTextHint")}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pdf-file">{t("form.pdfLabel")}</Label>
              <Input
                id="pdf-file"
                name="pdfFile"
                type="file"
                accept="application/pdf,.pdf"
                disabled={pending}
                required={contentMode === "pdf"}
                onChange={(e) => setPdfName(e.target.files?.[0]?.name ?? null)}
              />
              {pdfName ? (
                <p className="text-xs text-muted-foreground">
                  {t("form.pdfSelected", { name: pdfName })}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">{t("form.pdfHint")}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          checked={founderVisible}
          onChange={(e) => setFounderVisible(e.target.checked)}
          disabled={pending}
          className="size-4 rounded border-border"
        />
        <span>{t("form.founderVisible")}</span>
      </label>

      {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" variant="cta" disabled={pending}>
          {pending ? <Loader2 className="size-4 animate-spin" /> : null}
          {mode === "create" ? t("form.createSubmit") : t("form.editSubmit")}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => router.push("/admin/corpus")}
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
