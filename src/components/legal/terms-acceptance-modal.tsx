"use client";

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Check, Loader2, Scale } from "lucide-react";
import { acceptTermsAction } from "@/lib/legal/terms-actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type TermsAcceptanceModalProps = {
  open: boolean;
  termsHtml: string;
  termsVersion: string;
};

export function TermsAcceptanceModal({
  open,
  termsHtml,
  termsVersion,
}: TermsAcceptanceModalProps) {
  const t = useTranslations("legal.termsAcceptance");
  const locale = useLocale();
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!open) return null;

  function handleAccept() {
    if (!accepted) {
      setError(t("mustCheck"));
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await acceptTermsAction({
        locale,
        accepted: true,
      });
      if (!result.ok) {
        setError(t(`errors.${result.error}`));
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-background/80 p-0 pt-16 backdrop-blur-md sm:items-center sm:p-6 sm:pt-20"
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="terms-acceptance-title"
        className={cn(
          "relative flex max-h-[min(94dvh,calc(100dvh-5rem))] w-full max-w-3xl flex-col overflow-hidden",
          "rounded-t-3xl border border-border/70 bg-card shadow-glow sm:rounded-3xl",
        )}
      >
        <div className="shrink-0 border-b border-border/60 px-5 pb-4 pt-6 sm:px-6 sm:pt-7">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Scale className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 space-y-1.5">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/80">
                {t("eyebrow")}
              </p>
              <h2
                id="terms-acceptance-title"
                className="font-serif text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl"
              >
                {t("title")}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {t("subtitle")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("versionLabel", { version: termsVersion })}
              </p>
            </div>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <article
            className={cn(
              "terms-body space-y-3 text-sm leading-relaxed text-foreground",
              "[&_h3]:font-serif [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:tracking-tight",
              "[&_h4]:mt-5 [&_h4]:font-serif [&_h4]:text-base [&_h4]:font-semibold",
              "[&_h5]:mt-4 [&_h5]:text-sm [&_h5]:font-semibold",
              "[&_p]:text-muted-foreground [&_strong]:text-foreground",
              "[&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5",
              "[&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5",
              "[&_li]:text-muted-foreground",
            )}
            dangerouslySetInnerHTML={{ __html: termsHtml }}
          />
        </div>

        <div className="shrink-0 space-y-3 border-t border-border/60 bg-card px-5 py-4 sm:px-6 sm:py-5">
          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-border/70 bg-muted/30 px-3.5 py-3">
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 shrink-0 rounded border-border accent-primary"
              checked={accepted}
              disabled={pending}
              onChange={(e) => {
                setAccepted(e.target.checked);
                if (e.target.checked) setError(null);
              }}
            />
            <span className="text-sm leading-relaxed text-foreground">
              {t("checkbox")}
            </span>
          </label>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}

          <Button
            type="button"
            className="w-full"
            disabled={pending || !accepted}
            onClick={handleAccept}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            ) : (
              <Check className="h-4 w-4" aria-hidden />
            )}
            {pending ? t("submitting") : t("accept")}
          </Button>
          <p className="text-center text-xs text-muted-foreground">{t("requiredNote")}</p>
        </div>
      </div>
    </div>
  );
}
