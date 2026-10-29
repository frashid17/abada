"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
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
const fieldClassName = "min-h-[3.25rem] resize-y";

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
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [succeeded, setSucceeded] = useState(false);
  const [pending, startTransition] = useTransition();
  const onCompletedRef = useRef(onCompleted);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    queueMicrotask(() => setMounted(true));
  }, []);

  useEffect(() => {
    onCompletedRef.current = onCompleted;
  }, [onCompleted]);

  useEffect(() => {
    const saved = readFeedbackDraft(documentType);
    queueMicrotask(() => {
      if (saved) setDraft(saved);
      setHydrated(true);
    });
  }, [documentType]);

  useEffect(() => {
    if (!hydrated || succeeded) return;
    writeFeedbackDraft(documentType, draft);
  }, [documentType, draft, hydrated, succeeded]);

  useEffect(() => {
    if (!open) {
      queueMicrotask(() => {
        setSucceeded(false);
        setError(null);
      });
      return;
    }

    queueMicrotask(() => {
      scrollRef.current?.scrollTo({ top: 0 });
    });

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
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

  if (!open || !mounted) return null;

  const sliderValue = draft.easeRating ?? 3;
  const email = respondentEmail.trim();

  const modal = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-background/85 p-4 backdrop-blur-sm sm:p-6"
      role="presentation"
      onClick={() => {
        if (!pending && !succeeded) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="download-feedback-title"
        className={cn(
          "flex w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border bg-card shadow-card",
          "max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-3rem)]",
        )}
        onClick={(event) => event.stopPropagation()}
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
          <form
            onSubmit={handleSubmit}
            className="grid min-h-0 flex-1 grid-rows-[auto_minmax(0,1fr)_auto]"
          >
            <div className="border-b border-border/70 px-5 pb-4 pt-5 sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5 pr-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <MessageSquareText className="h-4 w-4" aria-hidden />
                  </div>
                  <h2
                    id="download-feedback-title"
                    className="font-serif text-xl font-semibold leading-snug tracking-tight"
                  >
                    {t("title")}
                  </h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">{t("subtitle")}</p>
                  <p className="inline-flex max-w-full rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                    <span className="truncate">{t(`documents.${documentType}`)}</span>
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="mt-0.5 h-9 w-9 shrink-0 rounded-xl"
                  onClick={onClose}
                  disabled={pending}
                  aria-label={t("close")}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div
              ref={scrollRef}
              className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-5 py-4 sm:px-6"
            >
              {email ? (
                <div className="rounded-xl border border-border/70 bg-muted/30 px-3 py-2.5 text-sm">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {t("emailLabel")}
                  </p>
                  <p className="mt-0.5 break-all font-medium text-foreground">{email}</p>
                </div>
              ) : null}

              <fieldset className="space-y-3">
                <legend className="text-sm font-medium leading-snug text-foreground">
                  {t("easeRating")}
                </legend>

                <div className="rounded-2xl border border-border/70 bg-muted/20 px-3.5 py-3.5">
                  <div className="mb-2.5 grid grid-cols-5 gap-1">
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

                  <div className="mt-2.5 flex items-center justify-between gap-3 text-[11px] font-medium text-foreground/80">
                    <span>{t("ratingLow")}</span>
                    <span>{t("ratingHigh")}</span>
                  </div>
                </div>
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-change" className="leading-snug">
                  {t("whatWouldChange")}
                </Label>
                <Textarea
                  id="feedback-change"
                  value={draft.whatWouldChange}
                  onChange={(e) => updateDraft({ whatWouldChange: e.target.value })}
                  disabled={pending}
                  required
                  rows={2}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-hardest" className="leading-snug">
                  {t("hardestTopic")}
                </Label>
                <Textarea
                  id="feedback-hardest"
                  value={draft.hardestTopic}
                  onChange={(e) => updateDraft({ hardestTopic: e.target.value })}
                  disabled={pending}
                  required
                  rows={2}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-founders" className="leading-snug">
                  {t("foundersWithoutLawyer")}
                </Label>
                <Textarea
                  id="feedback-founders"
                  value={draft.foundersWithoutLawyer}
                  onChange={(e) => updateDraft({ foundersWithoutLawyer: e.target.value })}
                  disabled={pending}
                  required
                  rows={2}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="feedback-time" className="leading-snug">
                  {t("lawyerTimeNeeded")}
                </Label>
                <Textarea
                  id="feedback-time"
                  value={draft.lawyerTimeNeeded}
                  onChange={(e) => updateDraft({ lawyerTimeNeeded: e.target.value })}
                  disabled={pending}
                  required
                  rows={2}
                  className={fieldClassName}
                />
              </div>

              <div className="space-y-1.5 pb-1">
                <Label htmlFor="feedback-name">{t("nameOptional")}</Label>
                <Input
                  id="feedback-name"
                  value={draft.respondentName}
                  onChange={(e) => updateDraft({ respondentName: e.target.value })}
                  disabled={pending}
                  autoComplete="name"
                />
              </div>

              {error ? (
                <p className="text-sm text-destructive" role="alert">
                  {error}
                </p>
              ) : null}
            </div>

            <div className="border-t border-border/70 bg-card px-5 py-4 sm:px-6">
              <Button type="submit" variant="cta" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("submitAndDownload")}
              </Button>
              <p className="mt-2 text-center text-[11px] leading-snug text-muted-foreground">
                {t("requiredHint")}
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
