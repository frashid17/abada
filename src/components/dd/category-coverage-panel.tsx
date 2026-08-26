import { getTranslations } from "next-intl/server";
import { Check, Circle } from "lucide-react";
import { DD_DOCUMENT_CATEGORIES, normalizeDdDocumentCategory } from "@/lib/dd/taxonomy";
import type { DataRoomDocumentRecord } from "@/lib/deals/types";
import { cn } from "@/lib/utils";

type CategoryCoveragePanelProps = {
  documents: DataRoomDocumentRecord[];
};

export async function CategoryCoveragePanel({ documents }: CategoryCoveragePanelProps) {
  const t = await getTranslations("founder.sala");
  const covered = new Set(
    documents
      .map((document) => normalizeDdDocumentCategory(document.taxonomyCategory))
      .filter((category): category is NonNullable<typeof category> => Boolean(category)),
  );

  return (
    <section className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
      <div className="border-b border-[color:var(--line-2)] bg-rail px-4 py-3 sm:px-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-highlight">
          {t("coverageTitle")}
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{t("coverageDescription")}</p>
      </div>
      <ul className="divide-y divide-[color:var(--line-2)]">
        {DD_DOCUMENT_CATEGORIES.map((category) => {
          const isCovered = covered.has(category);
          return (
            <li
              key={category}
              className={cn(
                "flex items-center gap-3 px-4 py-3 text-sm sm:px-5",
                isCovered ? "bg-good-bg/40 text-foreground" : "text-muted-foreground",
              )}
            >
              {isCovered ? (
                <Check className="h-4 w-4 shrink-0 text-good" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className="font-medium">{t(`categories.${category}`)}</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
