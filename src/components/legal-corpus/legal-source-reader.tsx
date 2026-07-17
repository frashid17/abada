"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChunkRow = {
  chunkIndex: number;
  articleRef: string;
  heading: string;
  content: string;
  translationStatus: string;
};

type LoadedPage = {
  key: string;
  chunks: ChunkRow[];
  total: number;
  hasMore: boolean;
  offset: number;
};

type LegalSourceReaderProps = {
  sourceId: string;
  locale: string;
  initialChunkCount: number;
};

export function LegalSourceReader({
  sourceId,
  locale,
  initialChunkCount,
}: LegalSourceReaderProps) {
  const t = useTranslations("founder.legalLibrary");
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState<LoadedPage | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  const loadKey = `${sourceId}|${locale}|${debouncedQuery}`;
  const loading = page?.key !== loadKey;
  const chunks = page?.key === loadKey ? page.chunks : [];
  const total = page?.key === loadKey ? page.total : initialChunkCount;
  const hasMore = page?.key === loadKey ? page.hasMore : false;
  const offset = page?.key === loadKey ? page.offset : 0;

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const params = new URLSearchParams({
          locale,
          offset: "0",
          limit: "60",
        });
        if (debouncedQuery) params.set("q", debouncedQuery);

        const res = await fetch(`/api/legal-corpus/${sourceId}?${params}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json()) as {
          chunks: ChunkRow[];
          chunkCount: number;
          hasMore: boolean;
        };

        setPage({
          key: loadKey,
          chunks: data.chunks,
          total: data.chunkCount,
          hasMore: data.hasMore,
          offset: 0,
        });
      } catch (error) {
        if (controller.signal.aborted) return;
        setPage({
          key: loadKey,
          chunks: [],
          total: 0,
          hasMore: false,
          offset: 0,
        });
        console.error(error);
      }
    }

    void load();
    return () => controller.abort();
  }, [sourceId, locale, debouncedQuery, loadKey]);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const nextOffset = offset + 60;
      const params = new URLSearchParams({
        locale,
        offset: String(nextOffset),
        limit: "60",
      });
      if (debouncedQuery) params.set("q", debouncedQuery);

      const res = await fetch(`/api/legal-corpus/${sourceId}?${params}`);
      if (!res.ok) throw new Error("fetch failed");
      const data = (await res.json()) as {
        chunks: ChunkRow[];
        chunkCount: number;
        hasMore: boolean;
      };

      setPage((prev) => {
        if (!prev || prev.key !== loadKey) return prev;
        return {
          key: loadKey,
          chunks: [...prev.chunks, ...data.chunks],
          total: data.chunkCount,
          hasMore: data.hasMore,
          offset: nextOffset,
        };
      });
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9"
          />
        </div>
        <p className="shrink-0 text-sm text-muted-foreground">
          {t("articleCount", { count: total })}
        </p>
      </div>

      {locale === "en-US" ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground/90">
          {t("englishPendingNote")}
        </p>
      ) : null}

      <article className="mx-auto w-full max-w-3xl rounded-2xl border border-border/50 bg-card/60 px-5 py-8 shadow-soft sm:px-10 sm:py-10">
        {loading && chunks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("loading")}</p>
        ) : null}

        {!loading && chunks.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">{t("noResults")}</p>
        ) : null}

        <div className="space-y-10">
          {chunks.map((chunk) => (
            <section
              key={chunk.chunkIndex}
              id={`art-${chunk.chunkIndex}`}
              className="scroll-mt-24 border-b border-border/40 pb-10 last:border-b-0 last:pb-0"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
                {chunk.articleRef}
              </p>
              <h2 className="mt-2 font-serif text-xl font-semibold leading-snug tracking-tight text-foreground sm:text-2xl">
                {chunk.heading}
              </h2>
              <div className="mt-4 whitespace-pre-wrap text-[15px] leading-[1.8] text-foreground/90 sm:text-base">
                {chunk.content}
              </div>
            </section>
          ))}
        </div>

        {hasMore ? (
          <div className="mt-10 border-t border-border/40 pt-6 text-center">
            <Button
              type="button"
              variant="outline"
              disabled={loading || loadingMore}
              onClick={() => void loadMore()}
            >
              {loadingMore ? t("loading") : t("loadMore")}
            </Button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
