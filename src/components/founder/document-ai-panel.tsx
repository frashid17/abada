"use client";

import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  MessageSquarePlus,
  SendHorizontal,
  Sparkles,
} from "lucide-react";
import type { FlowDocumentType } from "@/lib/documents/intake";
import type { FieldValues } from "@/lib/documents/intake/types";
import { AiMessageContent } from "@/components/founder/ai-message-content";
import { Button } from "@/components/ui/button";
import { getDisclaimer, stripAppendedDisclaimer } from "@/lib/ai/guardrails";
import { cn } from "@/lib/utils";

const PROMPT_KEYS: Record<FlowDocumentType, string[]> = {
  nda: ["mutual", "term", "purpose"],
  vesting: ["cliff", "acceleration", "departure"],
  ip: ["scope", "consideration"],
  employment: ["contract", "nonCompete"],
  shareholders: ["dragAlong", "tagAlong", "antiDilution"],
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type DocumentAiPanelProps = {
  documentType: FlowDocumentType;
  documentTitle: string;
  fields: FieldValues;
  fieldKeys: string[];
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const PANEL_HEIGHT =
  "h-[min(520px,calc(100dvh-8rem))] lg:h-[calc(100dvh-8rem)] lg:max-h-[calc(100dvh-8rem)]";

export function DocumentAiPanel({
  documentType,
  documentTitle,
  fields,
  fieldKeys,
}: DocumentAiPanelProps) {
  const t = useTranslations("founder.flow.ai");
  const locale = useLocale() as "es-CO" | "en-US";
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const filledCount = useMemo(
    () =>
      fieldKeys.filter((key) => {
        const value = fields[key];
        return value !== "" && value !== undefined && value !== null;
      }).length,
    [fields, fieldKeys],
  );

  const totalFields = fieldKeys.length;
  const progressPercent = totalFields > 0 ? Math.round((filledCount / totalFields) * 100) : 0;

  const suggestedPrompts = PROMPT_KEYS[documentType].map((key) =>
    t(`prompts.${documentType}.${key}`),
  );

  const lastAssistantMessage = [...messages].reverse().find((m) => m.role === "assistant");

  useEffect(() => {
    if (minimized || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, loading, minimized]);

  function startNewChat() {
    if (loading) return;
    setMessages([]);
    setInput("");
    setError(null);
    setMinimized(false);
    inputRef.current?.focus();
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);
    setError(null);
    setMinimized(false);

    const context = fieldKeys
      .filter((key) => {
        const value = fields[key];
        return value !== "" && value !== undefined && value !== null;
      })
      .map((key) => `${key}: ${fields[key]}`)
      .join("\n");

    const sessionContext = `${t("promptPrefix", { document: documentTitle })}\n${t("contextLabel")}: ${context || t("noContext")}`;

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
          sessionContext,
          history,
          task: "drafting",
          register: "founder",
          locale,
        }),
      });

      const contentType = response.headers.get("content-type") ?? "";

      if (!response.ok) {
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

      const disclaimer = data.disclaimer ?? getDisclaimer(locale);
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

  if (minimized) {
    return (
      <aside>
        <button
          type="button"
          onClick={() => setMinimized(false)}
          className={cn(
            "flex w-full cursor-pointer items-center gap-4 overflow-hidden rounded-2xl border border-border/70",
            "bg-card/95 px-5 py-4 text-left shadow-card backdrop-blur-sm transition-all duration-200",
            "hover:border-primary/25 hover:shadow-glow",
          )}
          aria-expanded={false}
          aria-label={t("expand")}
        >
          <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cta/10 text-primary">
            <Sparkles className="h-5 w-5" aria-hidden />
            {messages.length > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-cta ring-2 ring-card" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-serif text-base font-semibold text-foreground">{t("title")}</p>
            <p className="truncate text-sm text-muted-foreground">
              {lastAssistantMessage?.content ?? t("welcomeShort")}
            </p>
          </div>
          <ChevronUp className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        "flex flex-col overflow-hidden rounded-2xl border border-border/70",
        "bg-card/95 shadow-glow backdrop-blur-sm",
        PANEL_HEIGHT,
      )}
    >
      <header className="relative shrink-0 overflow-hidden border-b border-border/60 px-5 py-4">
        <div
          className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-primary/10 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-8 left-0 h-24 w-24 rounded-full bg-cta/10 blur-3xl"
          aria-hidden
        />

        <div className="relative flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3.5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-cta/15 text-primary shadow-soft">
              <Sparkles className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary/80">
                {t("badge")}
              </p>
              <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
                {t("title")}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {t("documentContext", { document: documentTitle })}
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {messages.length > 0 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-9 rounded-xl px-2.5 text-xs"
                disabled={loading}
                onClick={startNewChat}
                aria-label={t("newChat")}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                {t("newChat")}
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-xl"
              onClick={() => setMinimized(true)}
              aria-label={t("minimize")}
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative mt-4 space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{t("contextProgress", { filled: filledCount, total: totalFields })}</span>
            <span>{progressPercent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted/80">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-cta transition-all duration-500 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </header>

      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-5 overflow-y-auto px-5 py-5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="space-y-4 py-1">
            <div className="space-y-2 text-center">
              <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cta/10 text-primary">
                <Sparkles className="h-5 w-5" aria-hidden />
              </div>
              <div className="space-y-1">
                <p className="font-serif text-base font-semibold text-foreground">{t("emptyTitle")}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{t("welcomeShort")}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                {t("suggestionsLabel")}
              </p>
              <div className="flex flex-col gap-1.5">
                {suggestedPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={loading}
                    onClick={() => void sendMessage(prompt)}
                    className={cn(
                      "group cursor-pointer rounded-lg border border-border/70 bg-muted/30 px-3.5 py-2.5 text-left text-sm leading-snug text-foreground",
                      "transition-all duration-200 hover:border-primary/30 hover:bg-primary/5 hover:shadow-soft",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    <span className="line-clamp-2">{prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((message) =>
            message.role === "user" ? (
              <div key={message.id} className="flex justify-end">
                <div className="max-w-[88%] rounded-2xl rounded-br-md bg-primary px-4 py-3 text-primary-foreground shadow-soft">
                  <p className="text-[15px] leading-relaxed">{message.content}</p>
                </div>
              </div>
            ) : (
              <div key={message.id} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cta/10 text-primary">
                  <Sparkles className="h-4 w-4" aria-hidden />
                </div>
                <div className="max-w-[calc(100%-3rem)] flex-1 rounded-2xl rounded-tl-md border border-border/60 bg-muted/40 px-4 py-3.5">
                  <AiMessageContent content={message.content} />
                </div>
              </div>
            ),
          )
        )}

        {loading ? (
          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/15 to-cta/10 text-primary">
              <Sparkles className="h-4 w-4" aria-hidden />
            </div>
            <div className="flex items-center gap-3 rounded-2xl rounded-tl-md border border-border/60 bg-muted/40 px-4 py-3.5">
              <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden />
              <span className="text-sm text-muted-foreground">{t("loading")}</span>
            </div>
          </div>
        ) : null}

        {error ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </div>

      <footer className="shrink-0 border-t border-border/60 bg-card px-5 py-3.5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void sendMessage(input);
          }}
        >
          <label htmlFor="ai-chat-input" className="sr-only">
            {t("questionLabel")}
          </label>
          <div
            className={cn(
              "relative rounded-2xl border border-border/80 bg-background shadow-soft transition-all duration-200",
              "focus-within:border-primary/30 focus-within:ring-2 focus-within:ring-primary/15",
            )}
          >
            <textarea
              ref={inputRef}
              id="ai-chat-input"
              rows={1}
              value={input}
              disabled={loading}
              placeholder={t("placeholder")}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void sendMessage(input);
                }
              }}
              className="max-h-28 min-h-[44px] w-full resize-none rounded-2xl bg-transparent px-4 py-3 pr-14 text-[15px] leading-relaxed text-foreground placeholder:text-muted-foreground focus-visible:outline-none disabled:opacity-50"
            />
            <Button
              type="submit"
              variant="cta"
              size="icon"
              className="absolute bottom-2.5 right-2.5 h-10 w-10 rounded-xl shadow-soft"
              disabled={loading || !input.trim()}
              aria-label={t("send")}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <SendHorizontal className="h-4 w-4" />
              )}
            </Button>
          </div>
        </form>
        <p className="mt-2 text-center text-[10px] leading-relaxed text-muted-foreground">
          {t("disclaimer")}
        </p>
      </footer>
    </aside>
  );
}
