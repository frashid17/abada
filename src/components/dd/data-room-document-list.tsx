import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Download } from "lucide-react";
import type { DataRoomDocumentRecord } from "@/lib/deals/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <Card variant="elevated">
        <CardContent className="p-6">
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  const latestByCategory = new Map<string, DataRoomDocumentRecord>();
  for (const doc of documents) {
    const existing = latestByCategory.get(doc.taxonomyCategory);
    if (!existing || doc.versionNumber > existing.versionNumber) {
      latestByCategory.set(doc.taxonomyCategory, doc);
    }
  }

  return (
    <div className="space-y-3">
      {[...latestByCategory.values()]
        .sort((a, b) => a.taxonomyCategory.localeCompare(b.taxonomyCategory))
        .map((doc) => (
          <Card key={doc.id} variant="elevated">
            <CardHeader className="flex flex-row items-center justify-between gap-3 pb-2">
              <div>
                <CardTitle className="text-sm font-medium">{doc.title}</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {t(`categories.${doc.taxonomyCategory}`)} · {t("version", { n: doc.versionNumber })}
                </p>
              </div>
              {showDownload ? (
                <Link
                  href={`/api/data-room/${doc.id}/download`}
                  className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("download")}
                </Link>
              ) : null}
            </CardHeader>
            {doc.fingerprint ? (
              <CardContent className="pt-0">
                <p className="font-mono text-[10px] text-muted-foreground">{doc.fingerprint}</p>
              </CardContent>
            ) : null}
          </Card>
        ))}
    </div>
  );
}
