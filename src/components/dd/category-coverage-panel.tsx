import { getTranslations } from "next-intl/server";
import { Check, Circle } from "lucide-react";
import { DD_DOCUMENT_CATEGORIES } from "@/lib/dd/taxonomy";
import type { DataRoomDocumentRecord } from "@/lib/deals/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CategoryCoveragePanelProps = {
  documents: DataRoomDocumentRecord[];
};

export async function CategoryCoveragePanel({ documents }: CategoryCoveragePanelProps) {
  const t = await getTranslations("founder.sala");
  const covered = new Set(documents.map((document) => document.taxonomyCategory));

  return (
    <Card variant="feature">
      <CardHeader>
        <CardTitle className="text-base">{t("coverageTitle")}</CardTitle>
        <CardDescription>{t("coverageDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="grid gap-2 sm:grid-cols-2">
          {DD_DOCUMENT_CATEGORIES.map((category) => {
            const isCovered = covered.has(category);
            return (
              <li
                key={category}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
                  isCovered
                    ? "border-risk-low/30 bg-risk-low/5 text-foreground"
                    : "border-border/70 bg-muted/20 text-muted-foreground",
                )}
              >
                {isCovered ? (
                  <Check className="h-4 w-4 shrink-0 text-risk-low" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0" />
                )}
                {t(`categories.${category}`)}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
