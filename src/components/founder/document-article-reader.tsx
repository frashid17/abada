"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import {
  PROTOTYPE_DECISIONS,
  PROTOTYPE_DOC_ORDER,
  PROTOTYPE_DOCS,
  PROTOTYPE_TOKENS,
  flattenPrototypeArticles,
  type PrototypeArticle,
  type PrototypeDocId,
} from "@/lib/documents/prototype/catalog";
import { getTokenSampleRaw, resolveTokenDisplay } from "@/lib/documents/prototype/token-display";
import { usePrototypeDocumentStore } from "@/lib/documents/prototype/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type Mode = "guided" | "continuous";

function renderClauseHtml(
  text: string,
  tokenValue: (key: string) => string,
  decisionLabel: (key: string, lang: "es" | "en") => string | null,
  lang: "es" | "en",
): string {
  return text
    .replace(/\{\{(\w+(?:\.\w+)+)\}\}/g, (_, key: string) => {
      const { label, isUserValue } = resolveTokenDisplay(key, tokenValue(key), lang);
      const classes = isUserValue ? "proto-tk set" : "proto-tk set sample";
      return `<button type="button" class="${classes}" data-token="${key}">${escapeHtml(label)}</button>`;
    })
    .replace(/\[\[(\w+)\]\]/g, (_, key: string) => {
      const label = decisionLabel(key, lang);
      const set = label ? " set" : "";
      return `<button type="button" class="proto-tk${set}" data-dec="${key}">${escapeHtml(label || key)}</button>`;
    });
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function ArticleBody({
  article,
  lang,
  tokenValue,
  decisionLabel,
  onToken,
  onDec,
}: {
  article: PrototypeArticle;
  lang: "es" | "en";
  tokenValue: (key: string) => string;
  decisionLabel: (key: string, lang: "es" | "en") => string | null;
  onToken: (key: string) => void;
  onDec: (key: string) => void;
}) {
  const blocks = article.cl ?? [];

  return (
    <div
      className="proto-doc"
      onClick={(event) => {
        const target = event.target as HTMLElement;
        const token = target.closest<HTMLElement>("[data-token]");
        if (token?.dataset.token) {
          onToken(token.dataset.token);
          return;
        }
        const dec = target.closest<HTMLElement>("[data-dec]");
        if (dec?.dataset.dec) onDec(dec.dataset.dec);
      }}
    >
      {blocks.map((block, index) => {
        if (typeof block === "object" && block && "h" in block) {
          return (
            <h5
              key={index}
              className="mt-5 text-[12.5px] font-bold tracking-wide text-[color:var(--ink-2)]"
            >
              {block.h}
            </h5>
          );
        }
        const html = renderClauseHtml(String(block), tokenValue, decisionLabel, lang);
        return (
          <p key={index} className="mb-4 last:mb-0" dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </div>
  );
}

function DecisionCard({
  decKey,
  lang,
  value,
  onChange,
}: {
  decKey: string;
  lang: "es" | "en";
  value: string | number | undefined;
  onChange: (value: string | number) => void;
}) {
  const t = useTranslations("founder.documentsPrototype");
  const decision = PROTOTYPE_DECISIONS[decKey];
  if (!decision) return null;
  const isSet = value !== undefined && String(value).length > 0;

  return (
    <div id={`dec-${decKey}`} className="my-5 rounded-[10px] border border-accent-line bg-accent-soft px-[22px] py-5">
      <p className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-accent-fg">
        {t("decision")}
        {!isSet ? ` · ${t("pending")}` : ""}
      </p>
      <p className="mb-3.5 text-[15.5px] font-semibold text-foreground">
        {lang === "en" ? decision.q_en : decision.q_es}
      </p>
      {decision.type === "num" ? (
        <div className="flex items-center gap-2">
          <Input
            type="number"
            className="w-[110px]"
            value={value ?? decision.def ?? ""}
            onChange={(event) => onChange(Number(event.target.value))}
          />
          <span className="text-sm text-muted-foreground">
            {lang === "en" ? decision.unit_en : decision.unit_es}
          </span>
        </div>
      ) : (
        <div className="grid gap-2.5">
          {decision.options?.map((option) => {
            const pressed = String(value ?? decision.def) === option.v;
            return (
              <button
                key={option.v}
                type="button"
                aria-pressed={pressed}
                onClick={() => onChange(option.v)}
                className={cn(
                  "flex w-full gap-2.5 rounded-[9px] border border-border bg-card px-3.5 py-3 text-left transition-colors",
                  pressed && "border-highlight shadow-[0_0_0_2px_var(--accent-bg)]",
                )}
              >
                <span
                  className={cn(
                    "mt-1 grid h-[15px] w-[15px] shrink-0 place-items-center rounded-full border-[1.5px] border-muted-foreground",
                    pressed &&
                      "border-highlight after:block after:h-[7px] after:w-[7px] after:rounded-full after:bg-highlight",
                  )}
                />
                <span className="min-w-0">
                  <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">
                    {lang === "en" ? option.te : option.t}
                    {option.rec ? (
                      <span className="rounded-full border border-good-line bg-good-bg px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-good">
                        {t("recommended")}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-1 block text-[12.5px] leading-snug text-muted-foreground">
                    {lang === "en" ? option.c_en : option.c_es}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      )}
      {decision.hint_es ? (
        <p className="mt-3 text-[12.5px] text-muted-foreground">
          {lang === "en" ? decision.hint_en : decision.hint_es}
        </p>
      ) : null}
    </div>
  );
}

export function DocumentArticleReader({
  docId,
  initialIndex = 0,
}: {
  docId: PrototypeDocId;
  initialIndex?: number;
}) {
  const t = useTranslations("founder.documentsPrototype");
  const locale = useLocale();
  const lang = locale.startsWith("en") ? "en" : "es";
  const router = useRouter();
  const doc = PROTOTYPE_DOCS[docId];
  const articles = useMemo(() => flattenPrototypeArticles(docId), [docId]);
  const { store, setDecision, markSeen, tokenValue, setTokenValue } = usePrototypeDocumentStore();
  const [mode, setMode] = useState<Mode>("guided");
  const [index, setIndex] = useState(() =>
    Math.min(Math.max(initialIndex, 0), Math.max(articles.length - 1, 0)),
  );
  const [editingToken, setEditingToken] = useState<string | null>(null);
  const [tokenDraft, setTokenDraft] = useState("");

  const article = articles[index] ?? articles[0]!;
  const docOrderIndex = PROTOTYPE_DOC_ORDER.indexOf(docId);
  const nextDocId = PROTOTYPE_DOC_ORDER[docOrderIndex + 1];

  useEffect(() => {
    if (article) markSeen(docId, article.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mark once per article focus
  }, [docId, article?.id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (mode !== "guided") return;
      const target = event.target as HTMLElement | null;
      if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
      if (event.key === "ArrowRight" && index < articles.length - 1) {
        setIndex((value) => value + 1);
      }
      if (event.key === "ArrowLeft" && index > 0) {
        setIndex((value) => value - 1);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [articles.length, index, mode]);

  function decisionLabel(key: string, currentLang: "es" | "en"): string | null {
    const decision = PROTOTYPE_DECISIONS[key];
    const value = store.decisions[key];
    if (!decision || value === undefined || value === "") return null;
    if (decision.type === "num") return String(value);
    const option = decision.options?.find((item) => item.v === String(value));
    return option ? (currentLang === "en" ? option.te : option.t) : String(value);
  }

  function openToken(key: string) {
    setEditingToken(key);
    const current = tokenValue(key);
    setTokenDraft(current || getTokenSampleRaw(key, lang));
  }

  function goNext() {
    if (index < articles.length - 1) {
      setIndex((value) => value + 1);
      return;
    }
    if (nextDocId) {
      router.push(`/fundador/documentos/preparacion/${nextDocId}`);
      return;
    }
    router.push("/fundador/documentos/preparacion/revision");
  }

  const nextLabel =
    index >= articles.length - 1
      ? nextDocId
        ? t("nextDocument", {
            title: lang === "en" ? PROTOTYPE_DOCS[nextDocId].t_en : PROTOTYPE_DOCS[nextDocId].t_es,
          })
        : t("finish")
      : t("next");

  const artLabel =
    article.n === "—"
      ? t("opening")
      : article.n === "A"
        ? t("schedules")
        : `${t("art")} ${article.n}`;

  return (
    <div className="-mx-4 sm:-mx-5">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 sm:px-5">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-muted-foreground">
            <Link href="/fundador/documentos" className="hover:text-foreground">
              {t("back")}
            </Link>
            <span>›</span>
            <span className="truncate font-medium text-foreground">
              {lang === "en" ? doc.t_en : doc.t_es}
            </span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[264px_minmax(0,1fr)]">
        <aside className="sticky top-[60px] hidden max-h-[calc(100dvh-60px)] overflow-y-auto border-r border-border bg-rail px-3.5 py-5 lg:block">
          <div className="mb-3.5 flex overflow-hidden rounded-lg border border-border bg-muted">
            {(["guided", "continuous"] as const).map((item) => (
              <button
                key={item}
                type="button"
                aria-pressed={mode === item}
                onClick={() => setMode(item)}
                className={cn(
                  "flex-1 px-2.5 py-1.5 text-[12.5px] font-semibold",
                  mode === item ? "bg-card text-foreground shadow-sm" : "text-muted-foreground",
                )}
              >
                {t(item)}
              </button>
            ))}
          </div>

          {doc.groups.map((group) => (
            <div key={group.g_es}>
              <p className="mb-1.5 mt-4 px-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground first:mt-0">
                {lang === "en" ? group.g_en : group.g_es}
              </p>
              {group.arts.map((item) => {
                const artIndex = articles.findIndex((a) => a.id === item.id);
                const current = mode === "guided" && artIndex === index;
                const done = Boolean(store.seen[docId]?.[item.id]);
                const waiting = Boolean(item.dec && !store.decisions[item.dec]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-current={current}
                    onClick={() => {
                      setMode("guided");
                      setIndex(artIndex);
                    }}
                    className={cn(
                      "mb-0.5 flex w-full items-baseline gap-2 rounded-lg px-2.5 py-1.5 text-left text-[13px] leading-snug text-[color:var(--ink-2)]",
                      current && "bg-card font-semibold text-foreground shadow-sm",
                    )}
                  >
                    <span className="min-w-5 shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                      {item.n === "—" ? "·" : item.n}
                    </span>
                    <span className="min-w-0 flex-1 truncate">
                      {lang === "en" ? item.t_en : item.t_es}
                    </span>
                    <span
                      className={cn(
                        "mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-border",
                        done && !waiting && "bg-good",
                        waiting && "bg-highlight",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          ))}

          <Button asChild variant="outline" className="mt-5 w-full justify-center">
            <Link href="/fundador/documentos/preparacion/revision">{t("finish")}</Link>
          </Button>
        </aside>

        <div className="mx-auto w-full max-w-[820px] px-4 py-8 sm:px-10 sm:py-9">
          {mode === "guided" ? (
            <>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-highlight">
                {artLabel} · {index + 1} {t("of")} {articles.length}
              </p>
              <h1 className="mt-2 font-serif text-[30px] font-semibold tracking-tight">
                {lang === "en" ? article.t_en : article.t_es}
              </h1>

              <div className="mt-5 rounded-[10px] border border-border border-l-[3px] border-l-highlight bg-card px-[22px] py-5 shadow-sm">
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-highlight">
                      {t("whatIs")}
                    </h4>
                    <p className="text-[14.5px] text-[color:var(--ink-2)]">
                      {lang === "en" ? article.does_en : article.does_es}
                    </p>
                  </div>
                  <div className="border-t border-[color:var(--line-2)] pt-4">
                    <h4 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-highlight">
                      {t("whyMatters")}
                    </h4>
                    <p className="text-[14.5px] text-[color:var(--ink-2)]">
                      {lang === "en" ? article.matters_en : article.matters_es}
                    </p>
                  </div>
                  {article.note_es ? (
                    <div className="border-t border-[color:var(--line-2)] pt-4">
                      <h4 className="mb-2 text-[11.5px] font-bold uppercase tracking-[0.1em] text-highlight">
                        {t("negot")}
                      </h4>
                      <p className="text-[14.5px] text-[color:var(--ink-2)]">
                        {lang === "en" ? article.note_en : article.note_es}
                      </p>
                    </div>
                  ) : null}
                </div>
              </div>

              {article.dec ? (
                <DecisionCard
                  decKey={article.dec}
                  lang={lang}
                  value={store.decisions[article.dec]}
                  onChange={(value) => setDecision(article.dec!, value)}
                />
              ) : null}

              <div className="mb-3 mt-6 flex flex-wrap items-baseline gap-2 text-[10.5px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                <span>{t("text")}</span>
                <span className="font-medium normal-case tracking-normal opacity-60">
                  · {lang === "en" ? t("textHintEn") : t("textHint")}
                </span>
              </div>
              <ArticleBody
                article={article}
                lang={lang}
                tokenValue={tokenValue}
                decisionLabel={decisionLabel}
                onToken={openToken}
                onDec={(key) => {
                  const artIndex = articles.findIndex((a) => a.dec === key);
                  if (artIndex >= 0) setIndex(artIndex);
                }}
              />

              <div className="mt-8 flex justify-between gap-3 border-t border-border pt-5">
                <Button
                  type="button"
                  variant="outline"
                  disabled={index === 0}
                  onClick={() => setIndex((value) => Math.max(0, value - 1))}
                >
                  ← {t("prev")}
                </Button>
                <Button type="button" variant="cta" onClick={goNext}>
                  {nextLabel} →
                </Button>
              </div>
            </>
          ) : (
            <div className="space-y-8">
              <div>
                <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-highlight">
                  {t("continuous")}
                </p>
                <h1 className="mt-2 font-serif text-[30px] font-semibold tracking-tight">
                  {lang === "en" ? doc.full_en ?? doc.t_en : doc.full_es ?? doc.t_es}
                </h1>
              </div>
              <div className="proto-doc space-y-8">
                {articles.map((item) => (
                  <section key={item.id} id={`art-${item.id}`}>
                    <h2 className="mb-3.5 font-serif text-[21px] font-semibold tracking-tight">
                      {item.n !== "—" && item.n !== "A" ? `${item.n}. ` : ""}
                      {lang === "en" ? item.t_en : item.t_es}
                    </h2>
                    <ArticleBody
                      article={item}
                      lang={lang}
                      tokenValue={tokenValue}
                      decisionLabel={decisionLabel}
                      onToken={openToken}
                      onDec={() => undefined}
                    />
                  </section>
                ))}
              </div>
              <div className="flex justify-between gap-3 border-t border-border pt-5">
                <Button type="button" variant="outline" onClick={() => setMode("guided")}>
                  ← {t("guided")}
                </Button>
                <Button asChild variant="cta">
                  <Link href="/fundador/documentos/preparacion/revision">{t("finish")} →</Link>
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {editingToken ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/50 p-4">
          <div className="w-full max-w-[300px] rounded-xl border border-border bg-card p-4 shadow-lg">
            <h5 className="text-[12.5px] font-bold">
              {lang === "en"
                ? PROTOTYPE_TOKENS[editingToken]?.en
                : PROTOTYPE_TOKENS[editingToken]?.es}
            </h5>
            <p className="mt-1 text-[12px] text-muted-foreground">{t("tokenUpdates")}</p>
            <Input
              className="mt-2"
              autoFocus
              type={PROTOTYPE_TOKENS[editingToken]?.type === "date" ? "date" : "text"}
              value={tokenDraft}
              onChange={(event) => setTokenDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === "Escape") {
                  if (event.key === "Enter") setTokenValue(editingToken, tokenDraft);
                  setEditingToken(null);
                }
              }}
            />
            <div className="mt-3 flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setEditingToken(null)}>
                {t("back")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="cta"
                onClick={() => {
                  setTokenValue(editingToken, tokenDraft);
                  setEditingToken(null);
                }}
              >
                {t("setupSave")}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
