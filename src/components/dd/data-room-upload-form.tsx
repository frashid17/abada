"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Upload } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { uploadDataRoomDocumentAction } from "@/lib/dd/actions";
import { DD_DOCUMENT_CATEGORIES } from "@/lib/dd/taxonomy";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type DataRoomUploadFormProps = {
  dealId: string;
  uploaderName: string;
};

export function DataRoomUploadForm({ dealId, uploaderName }: DataRoomUploadFormProps) {
  const t = useTranslations("founder.sala");
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("dealId", dealId);
    formData.set("uploaderName", uploaderName);

    startTransition(async () => {
      const result = await uploadDataRoomDocumentAction(formData);
      if (result.ok) {
        setMessage(t("uploadSuccess"));
        formRef.current?.reset();
        router.refresh();
      } else {
        setError(t(`errors.${result.error}` as "errors.upload_failed"));
      }
    });
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-5 lg:sticky lg:top-24"
    >
      <div className="space-y-1">
        <h3 className="font-serif text-lg font-semibold">{t("uploadTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("uploadDescription")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="taxonomyCategory">{t("categoryLabel")}</Label>
        <Select id="taxonomyCategory" name="taxonomyCategory" required disabled={pending}>
          <option value="">{t("selectCategory")}</option>
          {DD_DOCUMENT_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {t(`categories.${category}`)}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">{t("documentTitleLabel")}</Label>
        <Input id="title" name="title" required disabled={pending} placeholder={t("documentTitlePlaceholder")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="file">{t("fileLabel")}</Label>
        <Input id="file" name="file" type="file" required disabled={pending} accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv,.png,.jpg,.jpeg" />
      </div>

      <label className="flex items-center gap-2 text-sm text-muted-foreground">
        <input type="checkbox" name="ndaGateRequired" value="true" disabled={pending} />
        {t("ndaGateLabel")}
      </label>

      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
        {pending ? t("uploading") : t("uploadCta")}
      </Button>

      {message ? <p className="text-sm text-risk-low">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
