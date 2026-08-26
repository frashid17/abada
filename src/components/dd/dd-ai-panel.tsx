"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Lock,
  MessageSquarePlus,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import { AiMessageContent } from "@/components/founder/ai-message-content";
import { AiCheckoutModal } from "@/components/payments/ai-checkout-modal";
import { Button } from "@/components/ui/button";
import { getDisclaimer, stripAppendedDisclaimer } from "@/lib/ai/guardrails";
import { cn } from "@/lib/utils";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DdAiPanelProps = {
  dealName: string;
  sessionContext: string;
  initialAccess: {
    hasAccess: boolean;
    paywallEnabled: boolean;
    amountFormatted: string;
  };
};

const PROMPT_KEYS = ["priorityGaps", "draftFinding", "assessmentAngle"] as const;

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function DdAiPanel({ dealName, sessionContext, initialAccess }: DdAiPanelProps) {
  const t = useTranslations("firm.dd.ai");
  const tPay = useTranslations("payments.checkout");
  const locale = useLocale() as "es-CO" | "en-US";
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(initialAccess.hasAccess);
  const [paywallEnabled] = useState(initialAccess.paywallEnabled);
  const [amountFormatted] = useState(initialAccess.amountFormatted);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const locked = paywallEnabled && !hasAccess;
  const suggestedPrompts = PROMPT_KEYS.map((key) => t(`prompts.${key}`));

  useEffect(() => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading]);

  function startNewChat() {
    if (loading || locked) return;
    setMessages([]);
    setInput("");
    setError(null);
    inputRef.current?.focus();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    if (locked) {
      setCheckoutOpen(true);
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);

    const history = messages.map((message) => ({
      role: message.role,
      content: message.content,
    }));

    try {
      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          sessionContext: `${t("promptPrefix", { deal: dealName })}\n${sessionContext}`,
          history,
          task: "dd_finding",
          register: "attorney",
          locale,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
        if (response.status === 402) {
          setHasAccess(false);
          setCheckoutOpen(true);
          setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
          return;
        }
        if (contentType.includes("application/json")) {
          const body = (await response.json()) as { error?: string };
          throw new Error(body.error ?? t("error"));
        }
        if (response.status === 503) throw new Error(t("errorNotConfigured"));
        throw new Error(t("error"));
      }

      if (!contentType.includes("application/json")) {
        throw new Error(t("error"));
      }

      const data = (await response.json()) as { text?: string; disclaimer?: string };
      if (!data.text) throw new Error(t("error"));

      const disclaimer = data.disclaimer ?? getDisclaimer(locale, "dd");
      const content = stripAppendedDisclaimer(data.text, disclaimer);

      setMessages((prev) => [
        ...prev,
        { id: createMessageId(), role: "assistant", content },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("error"));
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <>
      <div className="flex h-[min(520px,70dvh)] flex-col overflow-hidden rounded-[10px] border border-border bg-card">
        <div className="flex items-start justify-between gap-2 border-b border-[color:var(--line-2)] bg-rail px-4 py-3">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-1.5 text-highlight">
              <Sparkles className="h-3.5 w-3.5" aria-hidden />
              <p className="text-[11px] font-bold uppercase tracking-[0.12em]">{t("badge")}</p>
            </div>
            <p className="text-sm font-semibold text-foreground">{t("title")}</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">{t("description")}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="shrink-0"
            disabled={loading || locked || messages.length === 0}
            onClick={startNewChat}
            aria-label={t("newChat")}
          >
            <MessageSquarePlus className="h-4 w-4" />
          </Button>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-card px-4 py-4">
          {locked ? (
            <div className="border border-dashed border-accent-line bg-accent-soft p-4 text-center">
              <Lock className="mx-auto h-5 w-5 text-accent-fg" aria-hidden />
              <p className="mt-2 text-sm font-medium text-foreground">{tPay("lockedTitle")}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                {tPay("lockedBody", { amount: amountFormatted })}
              </p>
              <Button
                type="button"
                size="sm"
                variant="cta"
                className="mt-3"
                onClick={() => setCheckoutOpen(true)}
              >
                {tPay("unlockCta", { amount: amountFormatted })}
              </Button>
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-3">
              <p className="text-[15px] leading-relaxed text-[color:var(--ink-2)]">{t("welcome")}</p>
              <div className="overflow-hidden border border-[color:var(--line-2)] bg-rail">
                <p className="border-b border-[color:var(--line-2)] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("suggestionsLabel")}
                </p>
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(prompt)}
                    className={cn(
                      "w-full border-b border-[color:var(--line-2)] px-3 py-2.5 text-left text-[13.5px] leading-relaxed text-[color:var(--ink-2)] last:border-b-0",
                      "transition-colors hover:bg-card hover:text-accent-fg",
                    )}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "max-w-[90%] text-[15px] leading-relaxed",
                  message.role === "user"
                    ? "ml-auto rounded-[8px] bg-primary px-3.5 py-2.5 text-primary-foreground"
                    : "mr-2 border-l-2 border-highlight pl-4 text-foreground/90",
                )}
              >
                {message.role === "assistant" ? (
                  <>
                    <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.08em] text-highlight">
                      {t("badge")}
                    </p>
                    <AiMessageContent content={message.content} />
                  </>
                ) : (
                  <p className="whitespace-pre-wrap">{message.content}</p>
                )}
              </div>
            ))
          )}
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
              {t("loading")}
            </div>
          ) : null}
          {error ? (
            <p className="text-xs text-risk-med" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <form
          className="border-t border-[color:var(--line-2)] bg-card"
          onSubmit={(event) => {
            event.preventDefault();
            void sendMessage(input);
          }}
        >
          <div className="flex">
            <textarea
              ref={inputRef}
              value={input}
              rows={2}
              disabled={loading || locked}
              placeholder={t("placeholder")}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  void sendMessage(input);
                }
              }}
              className="min-h-[3rem] flex-1 resize-none border-0 bg-transparent px-4 py-3 text-sm outline-none ring-0 placeholder:text-muted-foreground focus-visible:bg-rail"
            />
            <Button
              type="submit"
              size="sm"
              variant="ghost"
              disabled={loading || locked || !input.trim()}
              className="self-stretch rounded-none border-l border-[color:var(--line-2)] px-5 font-bold"
              aria-label={t("send")}
            >
              <SendHorizontal className="h-4 w-4" />
            </Button>
          </div>
          <p className="border-t border-[color:var(--line-2)] bg-rail px-4 py-2 text-[10px] leading-relaxed text-muted-foreground">
            {t("disclaimer")}
          </p>
        </form>
      </div>

      <AiCheckoutModal
        open={checkoutOpen}
        amountFormatted={amountFormatted}
        onClose={() => setCheckoutOpen(false)}
        onSuccess={() => {
          setHasAccess(true);
          setCheckoutOpen(false);
        }}
      />
    </>
  );
}
