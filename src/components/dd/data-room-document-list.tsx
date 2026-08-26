import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Download, FileStack } from "lucide-react";
import type { DataRoomDocumentRecord } from "@/lib/deals/types";
import { normalizeDdDocumentCategory } from "@/lib/dd/taxonomy";

type DataRoomDocumentListProps = {
  documents: DataRoomDocumentRecord[];
  showDownload?: boolean;
};

export async function DataRoomDocumentList({
  documents,
  showDownload = true,
}: DataRoomDocumentListProps) {
  const t = await getTranslations("dd.documents");

  if (documents.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-[10px] border border-dashed border-border bg-rail/60 px-6 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center bg-muted text-muted-foreground">
          <FileStack className="h-5 w-5" />
        </div>
        <p className="text-sm text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  const latestByCategory = new Map<string, DataRoomDocumentRecord>();
  for (const doc of documents) {
    const key = normalizeDdDocumentCategory(doc.taxonomyCategory) ?? doc.taxonomyCategory;
    const existing = latestByCategory.get(key);
    if (!existing || doc.versionNumber > existing.versionNumber) {
      latestByCategory.set(key, doc);
    }
  }

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
      <ul className="divide-y divide-[color:var(--line-2)]">
        {[...latestByCategory.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([category, doc]) => (
            <li
              key={doc.id}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-rail"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{doc.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`categories.${category}`)} · {t("version", { n: doc.versionNumber })}
                </p>
              </div>
              {showDownload ? (
                <Link
                  href={`/api/data-room/${doc.id}/download`}
                  className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 border border-border px-2.5 py-1.5 text-xs font-semibold text-foreground transition-colors hover:border-highlight hover:text-highlight"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("download")}
                </Link>
              ) : null}
            </li>
          ))}
      </ul>
    </div>
  );
}
