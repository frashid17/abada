"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, MessageSquareText, X } from "lucide-react";
import { submitDownloadFeedbackAction } from "@/lib/documents/download-feedback-actions";
import type { FeedbackDocumentType } from "@/lib/documents/download-feedback";
import {
  clearFeedbackSession,
  readFeedbackDraft,
  writeFeedbackDraft,
  type DownloadFeedbackDraft,
} from "@/lib/documents/download-feedback-session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type DocumentDownloadFeedbackModalProps = {
  open: boolean;
  documentType: FeedbackDocumentType;
  respondentEmail: string;
  onClose: () => void;
  onCompleted: () => void;
};

const EMPTY_DRAFT: DownloadFeedbackDraft = {
  easeRating: null,
  whatWouldChange: "",
  hardestTopic: "",
  foundersWithoutLawyer: "",
  lawyerTimeNeeded: "",
  respondentName: "",
};

const RATING_VALUES = [1, 2, 3, 4, 5] as const;
const SUCCESS_DELAY_MS = 1200;

export function DocumentDownloadFeedbackModal({
  open,
  documentType,
  respondentEmail,
  onClose,
  onCompleted,
}: DocumentDownloadFeedbackModalProps) {
  const t = useTranslations("founder.flow.feedback");
  const [draft, setDraft] = useState<DownloadFeedbackDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [pending, startTransition] = useTransition();
  const onCompletedRef = useRef(onCompleted);
  onCompletedRef.current = onCompleted;

  useEffect(() => {
    const saved = readFeedbackDraft(documentType);
    if (saved) setDraft(saved);
    setHydrated(true);
  }, [documentType]);

  useEffect(() => {
    if (!hydrated || succeeded) return;
    writeFeedbackDraft(documentType, draft);
  }, [documentType, draft, hydrated, succeeded]);

  useEffect(() => {
    if (!open) {
      setSucceeded(false);
      setError(null);
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
    };
  }, [open]);

  useEffect(() => {
    if (!succeeded) return;
    const timer = window.setTimeout(() => {
      onCompletedRef.current();
    }, SUCCESS_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [succeeded]);

  function updateDraft(patch: Partial<DownloadFeedbackDraft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!draft.easeRating) {
      setError(t("errors.incomplete"));
      return;
    }

    startTransition(async () => {
      const result = await submitDownloadFeedbackAction({
        documentType,
        easeRating: draft.easeRating!,
        whatWouldChange: draft.whatWouldChange,
        hardestTopic: draft.hardestTopic,
        foundersWithoutLawyer: draft.foundersWithoutLawyer,
        lawyerTimeNeeded: draft.lawyerTimeNeeded,
        respondentName: draft.respondentName.trim() || undefined,
      });

      if (!result.ok) {
        setError(t(`errors.${result.error}`));
        return;
      }

      clearFeedbackSession(documentType);
      setDraft(EMPTY_DRAFT);
      setSucceeded(true);
    });
  }

  if (!open) return null;

  const sliderValue = draft.easeRating ?? 3;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center overflow-hidden bg-background/80 p-6 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal
      aria-labelledby="download-feedback-title"
    >
      <div
        className={cn(
          "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card",
          succeeded
            ? "max-h-[min(70dvh,28rem)]"
            : "max-h-[min(78dvh,calc(100dvh-4rem))] sm:max-h-[min(80dvh,calc(100dvh-5rem))]",
        )}
      >
        {succeeded ? (
          <div className="flex flex-col items-center justify-center gap-4 px-8 py-14 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Check className="h-5 w-5" strokeWidth={2.5} />
            </div>
            <div className="space-y-1.5">
              <h2 id="download-feedback-title" className="font-serif text-xl font-semibold">
                {t("successTitle")}
              </h2>
              <p className="text-sm text-muted-foreground">{t("successSubtitle")}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareText className="h-4 w-4" />
                  </div>
                  <h2 id="download-feedback-title" className="font-serif text-xl font-semibold">
                    {t("title")}
                  </h2>
                  <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
                  <p className="mt-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    {t(`documents.${documentType}`)}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  disabled={pending}
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 py-5">
                <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("emailLabel")}
                  </p>
                  <p className="mt-0.5 font-medium text-foreground">{respondentEmail}</p>
                </div>

                <fieldset className="space-y-4">
                  <legend className="text-sm font-medium text-foreground">{t("easeRating")}</legend>

                  <div className="rounded-2xl border border-border/70 bg-muted/20 px-4 py-4">
                    <div className="mb-3 grid grid-cols-5 gap-1">
                      {RATING_VALUES.map((value) => {
                        const selected = draft.easeRating === value;
                        return (
                          <button
                            key={value}
                            type="button"
                            disabled={pending}
                            onClick={() => updateDraft({ easeRating: value })}
                            className={cn(
                              "rounded-lg py-1.5 text-center text-sm font-semibold transition-colors",
                              selected
                                ? "bg-primary text-primary-foreground shadow-soft"
                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                            aria-pressed={selected}
                            aria-label={t("ratingOption", { value })}
                          >
                            {value}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={sliderValue}
                      disabled={pending}
                      aria-label={t("easeRating")}
                      aria-valuemin={1}
                      aria-valuemax={5}
                      aria-valuenow={sliderValue}
                      onChange={(e) => updateDraft({ easeRating: Number(e.target.value) })}
                      className={cn(
                        "feedback-rating-slider w-full cursor-pointer appearance-none bg-transparent",
                        "disabled:cursor-not-allowed disabled:opacity-50",
                      )}
                    />

                    <div className="mt-3 grid grid-cols-5 gap-1 text-[11px]">
                      <span className="col-span-1 text-left font-medium leading-tight text-foreground/80">
                        {t("ratingLow")}
                      </span>
                      <span className="col-span-3" aria-hidden />
                      <span className="col-span-1 text-right font-medium leading-tight text-foreground/80">
                        {t("ratingHigh")}
                      </span>
                    </div>
                  </div>
                </fieldset>

                <div className="space-y-2">
                  <Label htmlFor="feedback-change">{t("whatWouldChange")}</Label>
                  <Textarea
                    id="feedback-change"
                    value={draft.whatWouldChange}
                    onChange={(e) => updateDraft({ whatWouldChange: e.target.value })}
                    disabled={pending}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-hardest">{t("hardestTopic")}</Label>
                  <Textarea
                    id="feedback-hardest"
                    value={draft.hardestTopic}
                    onChange={(e) => updateDraft({ hardestTopic: e.target.value })}
                    disabled={pending}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-founders">{t("foundersWithoutLawyer")}</Label>
                  <Textarea
                    id="feedback-founders"
                    value={draft.foundersWithoutLawyer}
                    onChange={(e) => updateDraft({ foundersWithoutLawyer: e.target.value })}
                    disabled={pending}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-time">{t("lawyerTimeNeeded")}</Label>
                  <Textarea
                    id="feedback-time"
                    value={draft.lawyerTimeNeeded}
                    onChange={(e) => updateDraft({ lawyerTimeNeeded: e.target.value })}
                    disabled={pending}
                    required
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback-name">{t("nameOptional")}</Label>
                  <Input
                    id="feedback-name"
                    value={draft.respondentName}
                    onChange={(e) => updateDraft({ respondentName: e.target.value })}
                    disabled={pending}
                    autoComplete="name"
                  />
                </div>

                {error ? <p className="text-sm text-destructive">{error}</p> : null}
              </div>

              <div className="shrink-0 border-t border-border bg-card px-5 py-4">
                <Button type="submit" variant="cta" className="w-full" disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("submitAndDownload")}
                </Button>
                <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("requiredHint")}</p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
