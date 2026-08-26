"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { useMemo } from "react";
import {
  PROTOTYPE_DOC_ORDER,
  PROTOTYPE_DOCS,
  countPrototypeArticles,
  countPrototypeDecisions,
  type PrototypeDocId,
} from "@/lib/documents/prototype/catalog";
import { usePrototypeDocumentStore } from "@/lib/documents/prototype/store";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function docProgress(
  docId: PrototypeDocId,
  seen: Record<string, Record<string, boolean>>,
  decisions: Record<string, string | number>,
  articles: ReturnType<typeof import("@/lib/documents/prototype/catalog").flattenPrototypeArticles>,
) {
  const totalDec = articles.filter((a) => a.dec).length;
  const doneDec = articles.filter(
    (a) => a.dec && decisions[a.dec] !== undefined && String(decisions[a.dec]).length > 0,
  ).length;
  const seenCount = Object.keys(seen[docId] ?? {}).length;
  return { totalDec, doneDec, seenCount, totalArts: articles.length };
}

export function DocumentsPrototypeHub({
  secondary,
}: {
  secondary?: React.ReactNode;
}) {
  const t = useTranslations("founder.documentsPrototype");
  const locale = useLocale();
  const lang = locale.startsWith("en") ? "en" : "es";
  const { store, hydrated } = usePrototypeDocumentStore();

  const companyReady = Boolean(store.company.nombre.trim() && store.company.nit.trim());

  const cards = useMemo(() => {
    return PROTOTYPE_DOC_ORDER.map((id, index) => {
      const doc = PROTOTYPE_DOCS[id];
      const arts = doc.groups.flatMap((g) => g.arts);
      const progress = docProgress(id, store.seen, store.decisions, arts);
      const status =
        progress.doneDec === 0 && progress.seenCount === 0
          ? "notStarted"
          : progress.doneDec >= progress.totalDec && progress.totalDec > 0
            ? "done"
            : "inProgress";
      const pct =
        progress.totalDec > 0
          ? Math.round((progress.doneDec / progress.totalDec) * 100)
          : Math.round((progress.seenCount / Math.max(progress.totalArts, 1)) * 100);
      return { id, doc, index, status, pct, progress };
    });
  }, [store.decisions, store.seen]);

  return (
    <div className="pb-16 pt-2">
      <p className="text-[11.5px] font-bold uppercase tracking-[0.12em] text-highlight">
        {t("eyebrow")}
      </p>
      <h1 className="mt-2.5 font-serif text-[34px] font-semibold tracking-tight text-foreground">
        {t("homeH1")}
      </h1>
      <p className="mt-3 max-w-[62ch] text-[16.5px] leading-relaxed text-[color:var(--ink-2)]">
        {t("homeLede")}
      </p>

      <div className="mt-7 flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-card p-[18px_20px] shadow-sm">
        <span
          className={cn(
            "inline-flex rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
            companyReady
              ? "border-good-line bg-good-bg text-good"
              : "border-accent-line bg-accent-soft text-accent-fg",
          )}
        >
          {companyReady ? `✓ ${t("setupReady")}` : `! ${t("setup")}`}
        </span>
        <p className="min-w-[200px] flex-1 text-[13px] text-muted-foreground">
          {hydrated && companyReady
            ? `${store.company.nombre} · NIT ${store.company.nit}`
            : t("setupLede")}
        </p>
        <Button asChild size="sm" variant={companyReady ? "outline" : "cta"}>
          <Link href="/fundador/documentos/preparacion/datos">
            {companyReady ? t("setupEdit") : t("start")}
          </Link>
        </Button>
      </div>

      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(({ id, doc, index, status, pct, progress }) => (
          <Link
            key={id}
            href={`/fundador/documentos/preparacion/${id}`}
            className={cn(
              "flex flex-col gap-2.5 rounded-[14px] border border-border bg-card p-[22px] text-left shadow-sm transition-all",
              "hover:-translate-y-px hover:border-muted-foreground/40 hover:shadow-md",
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12.5px] font-semibold text-muted-foreground">
                {t("docNumber", { n: index + 1 })}
              </span>
              <span
                className={cn(
                  "inline-flex rounded-full border px-2.5 py-0.5 text-[11.5px] font-semibold",
                  status === "done" && "border-good-line bg-good-bg text-good",
                  status === "inProgress" && "border-accent-line bg-accent-soft text-accent-fg",
                  status === "notStarted" && "border-border bg-muted text-muted-foreground",
                )}
              >
                {t(status)}
              </span>
            </div>
            <h3 className="font-serif text-xl font-semibold tracking-tight">
              {lang === "en" ? doc.t_en : doc.t_es}
            </h3>
            <p className="text-sm leading-relaxed text-[color:var(--ink-2)]">
              {lang === "en" ? doc.sub_en : doc.sub_es}
            </p>
            <div className="mt-auto space-y-2 pt-2">
              <div className="h-[5px] overflow-hidden rounded-full bg-[color:var(--line-2)]">
                <i
                  className="block h-full rounded-full bg-good transition-[width]"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="text-[12.5px] text-muted-foreground">
                {progress.doneDec} {t("of")} {countPrototypeDecisions(id)} {t("decisions")} ·{" "}
                {countPrototypeArticles(id)} {t("articles")}
              </p>
            </div>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-[12.5px] text-muted-foreground">{t("langNote")}</p>

      {secondary ? <div className="mt-12 space-y-4">{secondary}</div> : null}
    </div>
  );
}
