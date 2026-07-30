"use client";

import { useTranslations } from "next-intl";
import { useEffect, useId, useState, type FormEvent } from "react";
import {
  CheckCircle2,
  CreditCard,
  Loader2,
  Lock,
  Smartphone,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

type PaymentMethod = "card" | "nequi" | "daviplata";

type AiCheckoutModalProps = {
  open: boolean;
  amountFormatted: string;
  onClose: () => void;
  onSuccess: () => void;
};

function formatCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}

export function AiCheckoutModal({
  open,
  amountFormatted,
  onClose,
  onSuccess,
}: AiCheckoutModalProps) {
  const t = useTranslations("payments.checkout");
  const titleId = useId();
  const [method, setMethod] = useState<PaymentMethod>("card");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !submitting) onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, submitting]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting || succeeded) return;

    setSubmitting(true);
    setError(null);

    const payload =
      method === "card"
        ? {
            method: "card" as const,
            cardholderName: cardholderName.trim(),
            cardNumber: cardNumber.replace(/\D/g, ""),
            expiry,
            cvc: cvc.replace(/\D/g, ""),
          }
        : {
            method,
            phone: phone.replace(/\D/g, ""),
          };

    try {
      const response = await fetch("/api/payments/mock-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await response.json().catch(() => ({}))) as {
        error?: string;
        ok?: boolean;
      };

      if (!response.ok) {
        throw new Error(data.error ?? t("error"));
      }

      setSucceeded(true);
      window.setTimeout(() => {
        onSuccess();
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
      setSubmitting(false);
    }
  }

  const methods: { id: PaymentMethod; label: string; icon: typeof CreditCard }[] = [
    { id: "card", label: t("methods.card"), icon: CreditCard },
    { id: "nequi", label: t("methods.nequi"), icon: Smartphone },
    { id: "daviplata", label: t("methods.daviplata"), icon: Smartphone },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/75 p-0 pt-20 backdrop-blur-md sm:items-center sm:p-6 sm:pt-24"
      role="presentation"
      onClick={() => {
        if (!submitting && !succeeded) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative flex max-h-[min(94dvh,calc(100dvh-5.5rem))] w-full max-w-lg flex-col overflow-hidden",
          "rounded-t-3xl border border-border/70 bg-card shadow-glow sm:rounded-3xl",
        )}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="relative shrink-0 border-b border-border/60 px-5 pb-6 pt-8 sm:px-6 sm:pb-7 sm:pt-10">
          <div
            className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-primary/15 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -bottom-10 left-0 h-32 w-32 rounded-full bg-cta/10 blur-3xl"
            aria-hidden
          />
          <div className="relative flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2 pr-2">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/80">
                {t("eyebrow")}
              </p>
              <h2 id={titleId} className="font-serif text-2xl font-semibold leading-snug tracking-tight text-foreground">
                {t("title")}
              </h2>
              <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
                {t("subtitle")}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-0.5 h-9 w-9 shrink-0 rounded-xl"
              disabled={submitting}
              onClick={onClose}
              aria-label={t("close")}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative mt-6 flex items-end justify-between gap-3 rounded-2xl border border-border/60 bg-background/70 px-4 py-3.5 backdrop-blur-sm">
            <div>
              <p className="text-xs text-muted-foreground">{t("product")}</p>
              <p className="mt-0.5 text-sm font-medium text-foreground">{t("productDetail")}</p>
            </div>
            <p className="font-serif text-2xl font-semibold tabular-nums text-foreground">
              {amountFormatted}
            </p>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-5 pt-7 sm:px-6 sm:pt-8">
          {succeeded ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <CheckCircle2 className="h-7 w-7" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-xl font-semibold text-foreground">{t("successTitle")}</p>
                <p className="text-sm text-muted-foreground">{t("successBody")}</p>
              </div>
            </div>
          ) : (
            <form id="ai-checkout-form" className="space-y-6" onSubmit={(e) => void handleSubmit(e)}>
              <fieldset className="space-y-3">
                <legend className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("methodLabel")}
                </legend>
                <div className="grid grid-cols-3 gap-2.5">
                  {methods.map(({ id, label, icon: Icon }) => {
                    const selected = method === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        onClick={() => {
                          setMethod(id);
                          setError(null);
                        }}
                        className={cn(
                          "flex min-h-[4.5rem] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border px-2 py-3 text-center transition-all duration-200",
                          selected
                            ? "border-primary/40 bg-primary/8 shadow-soft"
                            : "border-border/70 bg-muted/20 hover:border-primary/25 hover:bg-muted/40",
                        )}
                        aria-pressed={selected}
                      >
                        <Icon
                          className={cn("h-4 w-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")}
                          aria-hidden
                        />
                        <span
                          className={cn(
                            "text-[11px] font-medium leading-snug sm:text-xs",
                            selected ? "text-foreground" : "text-muted-foreground",
                          )}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              {method === "card" ? (
                <div className="space-y-4 border-t border-border/50 pt-6">
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-card-name">{t("card.name")}</Label>
                    <Input
                      id="ai-card-name"
                      autoComplete="cc-name"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      placeholder={t("card.namePlaceholder")}
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-card-number">{t("card.number")}</Label>
                    <Input
                      id="ai-card-number"
                      inputMode="numeric"
                      autoComplete="cc-number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                      placeholder="4242 4242 4242 4242"
                      required
                      disabled={submitting}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="ai-card-expiry">{t("card.expiry")}</Label>
                      <Input
                        id="ai-card-expiry"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        value={expiry}
                        onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        placeholder={t("card.expiryPlaceholder")}
                        required
                        disabled={submitting}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ai-card-cvc">{t("card.cvc")}</Label>
                      <Input
                        id="ai-card-cvc"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        value={cvc}
                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder={t("card.cvcPlaceholder")}
                        required
                        disabled={submitting}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 border-t border-border/50 pt-6">
                  <div className="rounded-xl border border-border/60 bg-muted/25 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
                    {method === "nequi" ? t("mobile.nequiHint") : t("mobile.daviplataHint")}
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="ai-mobile-phone">{t("mobile.phone")}</Label>
                    <div className="flex gap-2">
                      <div className="flex h-10 shrink-0 items-center rounded-lg border border-border bg-muted/40 px-3 text-sm font-medium text-muted-foreground">
                        +57
                      </div>
                      <Input
                        id="ai-mobile-phone"
                        inputMode="tel"
                        autoComplete="tel-national"
                        value={phone}
                        onChange={(e) => setPhone(formatPhone(e.target.value))}
                        placeholder={t("mobile.phonePlaceholder")}
                        required
                        disabled={submitting}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              )}

              {error ? (
                <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-3.5 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              ) : null}
            </form>
          )}
        </div>

        {!succeeded ? (
          <footer className="shrink-0 space-y-3 border-t border-border/60 bg-card px-5 py-4 sm:px-6">
            <Button
              type="submit"
              form="ai-checkout-form"
              variant="cta"
              size="lg"
              className="h-12 w-full rounded-xl text-base"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("processing")}
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  {t("pay", { amount: amountFormatted })}
                </>
              )}
            </Button>
            <p className="flex items-center justify-center gap-1.5 text-center text-[11px] text-muted-foreground">
              <Lock className="h-3 w-3" aria-hidden />
              {t("secureNote")}
            </p>
          </footer>
        ) : null}
      </div>
    </div>
  );
}
