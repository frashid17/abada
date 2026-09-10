"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

export default function FounderDocumentsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("founder.documentsPage");

  useEffect(() => {
    console.error("[fundador/documentos]", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="font-serif text-2xl font-semibold tracking-tight">{t("errorTitle")}</h1>
      <p className="text-sm text-muted-foreground">{t("errorDescription")}</p>
      {error.message ? (
        <p className="break-words rounded-lg border border-border bg-muted/40 px-3 py-2 font-mono text-xs text-muted-foreground">
          {error.message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center justify-center gap-2">
        <Button type="button" variant="cta" onClick={reset}>
          {t("errorRetry")}
        </Button>
        <Button asChild variant="outline">
          <Link href="/fundador">{t("errorBack")}</Link>
        </Button>
      </div>
    </div>
  );
}
