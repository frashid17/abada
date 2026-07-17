"use client";

import { useCallback, useEffect, useState } from "react";
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
  const [chunks, setChunks] = useState<ChunkRow[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(initialChunkCount);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(timer);
  }, [query]);

  const fetchChunks = useCallback(
    async (nextOffset: number, append: boolean) => {
      setLoading(true);
      try {
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

        setChunks((prev) => (append ? [...prev, ...data.chunks] : data.chunks));
        setTotal(data.chunkCount);
        setHasMore(data.hasMore);
        setOffset(nextOffset);
      } finally {
        setLoading(false);
      }
    },
    [sourceId, locale, debouncedQuery],
  );

  useEffect(() => {
    setChunks([]);
    setOffset(0);
    void fetchChunks(0, false);
  }, [fetchChunks]);

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
              disabled={loading}
              onClick={() => void fetchChunks(offset + 60, true)}
            >
              {loading ? t("loading") : t("loadMore")}
            </Button>
          </div>
        ) : null}
      </article>
    </div>
  );
}
