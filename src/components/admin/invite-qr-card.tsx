"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Copy, Download, Loader2, QrCode } from "lucide-react";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";

type InviteQrCardProps = {
  /** Absolute URL encoded in the QR (e.g. founder signup). */
  url: string;
  /** Optional label override for download filename stem. */
  fileStem?: string;
};

type QrResult =
  | { status: "ready"; forUrl: string; dataUrl: string }
  | { status: "error"; forUrl: string; message: string };

export function InviteQrCard({ url, fileStem = "abada-acceso-beta" }: InviteQrCardProps) {
  const t = useTranslations("admin.invites.qr");
  const [result, setResult] = useState<QrResult | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void QRCode.toDataURL(url, {
      errorCorrectionLevel: "M",
      margin: 2,
      width: 512,
      color: {
        // High-contrast ink for reliable camera scanning (not UI tokens).
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((dataUrl) => {
        if (!cancelled) setResult({ status: "ready", forUrl: url, dataUrl });
      })
      .catch(() => {
        if (!cancelled) {
          setResult({ status: "error", forUrl: url, message: t("generateError") });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [url, t]);

  const dataUrl = result?.status === "ready" && result.forUrl === url ? result.dataUrl : null;
  const error = result?.status === "error" && result.forUrl === url ? result.message : null;

  async function copyLink() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  function downloadPng() {
    if (!dataUrl) return;
    const anchor = document.createElement("a");
    anchor.href = dataUrl;
    anchor.download = `${fileStem}.png`;
    anchor.click();
  }

  return (
    <section className="rounded-2xl border border-border/70 bg-muted/30 p-5">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-3">
          <div className="flex h-48 w-48 items-center justify-center rounded-xl border border-border/60 bg-background p-3">
            {dataUrl ? (
              // Data URL from qrcode — next/image is not useful here.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dataUrl} alt={t("imageAlt")} className="h-full w-full" />
            ) : error ? (
              <QrCode className="h-10 w-10 text-muted-foreground" aria-hidden />
            ) : (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden />
            )}
          </div>
          {error ? <p className="max-w-48 text-center text-xs text-destructive">{error}</p> : null}
        </div>

        <div className="min-w-0 flex-1 space-y-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" aria-hidden />
              <h3 className="font-serif text-lg font-semibold">{t("title")}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{t("description")}</p>
          </div>

          <p className="break-all font-mono text-xs text-muted-foreground">{url}</p>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" onClick={downloadPng} disabled={!dataUrl}>
              <Download className="h-4 w-4" />
              {t("download")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
              <Copy className="h-4 w-4" />
              {copied ? t("copied") : t("copyLink")}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground">{t("flowHint")}</p>
        </div>
      </div>
    </section>
  );
}
