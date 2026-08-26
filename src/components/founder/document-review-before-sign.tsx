"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useCallback, useRef, useState } from "react";
import { Download, ExternalLink, Eye, Loader2, RefreshCw } from "lucide-react";
import {
  PROTOTYPE_DECISIONS,
  PROTOTYPE_DOCS,
  listPrototypeDecisionRows,
} from "@/lib/documents/prototype/catalog";
import { usePrototypeDocumentStore } from "@/lib/documents/prototype/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function DocumentReviewBeforeSign() {
  const t = useTranslations("founder.documentsPrototype");
  const locale = useLocale() as "es-CO" | "en-US";
  const lang = locale.startsWith("en") ? "en" : "es";
  const { store, hydrated } = usePrototypeDocumentStore();
  const [toast, setToast] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filename, setFilename] = useState("abada-revision-decisiones-borrador.pdf");
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);

  const rows = listPrototypeDecisionRows();
  const openCount = rows.filter((row) => {
    const value = store.decisions[row.key];
    return value === undefined || value === "";
  }).length;

  function decisionLabel(key: string): string {
    const decision = PROTOTYPE_DECISIONS[key];
    const value = store.decisions[key] ?? decision?.def;
    if (!decision || value === undefined || value === "") {
      return lang === "en" ? decision?.en ?? key : decision?.es ?? key;
    }
    if (decision.type === "num") return String(value);
    const option = decision.options?.find((item) => item.v === String(value));
    return option ? (lang === "en" ? option.te : option.t) : String(value);
  }

  function isSet(key: string): boolean {
    const value = store.decisions[key];
    return value !== undefined && String(value).length > 0;
  }

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const fetchPdfBlob = useCallback(async () => {
    const response = await fetch("/api/documents/review-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        locale,
        company: store.company,
        decisions: store.decisions,
      }),
    });

    if (!response.ok) {
      throw new Error("download_failed");
    }

    const disposition = response.headers.get("Content-Disposition") ?? "";
    const match = disposition.match(/filename="([^"]+)"/);
    if (match?.[1]) setFilename(match[1]);

    return response.blob();
  }, [locale, store.company, store.decisions]);

  async function loadPreview() {
    setLoadingPreview(true);
    setError(null);
    try {
      const blob = await fetchPdfBlob();
      revokePreview();
      const url = URL.createObjectURL(blob);
      previewUrlRef.current = url;
      setPreviewUrl(url);
    } catch {
      setError(t("downloadError"));
      setPreviewUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function downloadDraft() {
    setDownloading(true);
    setError(null);
    try {
      if (previewUrl) {
        const anchor = document.createElement("a");
        anchor.href = previewUrl;
        anchor.download = filename;
        anchor.click();
        return;
      }
      const blob = await fetchPdfBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setError(t("downloadError"));
    } finally {
      setDownloading(false);
    }
  }

  if (!hydrated) {
    return <div className="min-h-[40vh]" aria-hidden />;
  }

  return (
    <div className="mx-auto max-w-[1000px] space-y-6 pb-16">
      <div>
        <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-highlight">
          {t("review")}
        </p>
        <h1 className="mt-2.5 font-serif text-[34px] font-semibold tracking-tight">
          {t("reviewH")}
        </h1>
        <p className="mt-3 max-w-[62ch] text-[16.5px] leading-relaxed text-[color:var(--ink-2)]">
          {t("reviewLede")}
        </p>
      </div>

      <section className="rounded-[14px] border border-border bg-card p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-semibold">{t("openDec")}</h2>
          <span
            className={cn(
              "inline-flex rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
              openCount > 0
                ? "border-accent-line bg-accent-soft text-accent-fg"
                : "border-good-line bg-good-bg text-good",
            )}
          >
            {openCount > 0 ? `${openCount} ${t("decisions")}` : t("allDone")}
          </span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t("openDecHint")}</p>
      </section>

      <section className="overflow-hidden rounded-[14px] border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[color:var(--line-2)] bg-rail text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                <th className="px-4 py-3">{t("yourDec")}</th>
                <th className="px-4 py-3">{t("value")}</th>
                <th className="px-4 py-3">{t("where")}</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const decision = PROTOTYPE_DECISIONS[row.key];
                const set = isSet(row.key);
                const articleIndex = PROTOTYPE_DOCS[row.docId].groups
                  .flatMap((group) => group.arts)
                  .findIndex((article) => article.id === row.article.id);
                return (
                  <tr key={row.key} className="border-b border-[color:var(--line-2)] last:border-b-0">
                    <td className="px-4 py-4 align-top">
                      <p className="font-semibold text-foreground">
                        {lang === "en" ? decision?.en : decision?.es}
                      </p>
                      <p className="mt-1 text-[12.5px] text-muted-foreground">
                        {lang === "en" ? decision?.q_en : decision?.q_es}
                      </p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span
                        className={cn(
                          "inline-flex rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
                          set
                            ? "border-good-line bg-good-bg text-good"
                            : "border-accent-line bg-accent-soft text-accent-fg",
                        )}
                      >
                        {decisionLabel(row.key)}
                        {!set ? ` · ${t("defaultTag")}` : ""}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-[12.5px] text-muted-foreground">
                      {lang === "en" ? PROTOTYPE_DOCS[row.docId].t_en : PROTOTYPE_DOCS[row.docId].t_es}
                      <br />
                      {lang === "en" ? row.article.t_en : row.article.t_es}
                    </td>
                    <td className="px-4 py-4 align-top text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link
                          href={`/fundador/documentos/preparacion/${row.docId}?art=${Math.max(articleIndex, 0)}`}
                        >
                          {set ? t("edit") : t("fill")}
                        </Link>
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-4 rounded-[14px] border border-border bg-card p-4 shadow-sm sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-serif text-lg font-semibold">{t("previewDraft")}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t("previewHint")}</p>
          </div>
          {previewUrl ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loadingPreview}
              onClick={() => void loadPreview()}
            >
              {loadingPreview ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              {t("refreshPreview")}
            </Button>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-[10px] border border-border bg-rail">
          {loadingPreview ? (
            <div className="flex h-[min(72vh,780px)] items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              {t("previewLoading")}
            </div>
          ) : previewUrl ? (
            <iframe
              title={t("previewDraft")}
              src={previewUrl}
              className="h-[min(72vh,780px)] w-full bg-white"
            />
          ) : (
            <div className="flex h-56 flex-col items-center justify-center gap-4 px-4 text-center">
              <p className="max-w-md text-sm text-muted-foreground">{t("previewHint")}</p>
              <Button type="button" variant="cta" onClick={() => void loadPreview()}>
                <Eye className="h-4 w-4" />
                {t("previewDraft")}
              </Button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/fundador/documentos">{t("back")}</Link>
          </Button>
          <Button
            type="button"
            variant="cta"
            disabled={downloading || loadingPreview || !previewUrl}
            onClick={() => void downloadDraft()}
          >
            {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            {downloading ? t("downloading") : t("downloadDraft")}
          </Button>
          {previewUrl ? (
            <Button asChild variant="outline">
              <a href={previewUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4" />
                {t("openInNewTab")}
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setToast(t("sendReviewToast"));
              window.setTimeout(() => setToast(null), 4000);
            }}
          >
            {t("sendReview")}
          </Button>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {toast ? (
          <p className="rounded-[10px] border border-accent-line bg-accent-soft px-4 py-3 text-sm text-accent-fg">
            {toast}
          </p>
        ) : null}
      </section>
    </div>
  );
}
