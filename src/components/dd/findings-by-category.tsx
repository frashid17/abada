import { getTranslations } from "next-intl/server";
import { DD_RISK_CATEGORIES } from "@/lib/dd/taxonomy";
import type { FindingRecord } from "@/lib/dd/findings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const LEVEL_STYLES = {
  bajo: "border-risk-low/30 bg-risk-low/10 text-risk-low",
  medio: "border-risk-med/30 bg-risk-med/10 text-risk-med",
  alto: "border-risk-high/30 bg-risk-high/10 text-risk-high",
} as const;

type FindingsByCategoryProps = {
  findingsByCategory: Record<string, FindingRecord[]>;
  translationNamespace?: "firm.dd" | "investor.room";
};

export async function FindingsByCategory({
  findingsByCategory,
  translationNamespace = "firm.dd",
}: FindingsByCategoryProps) {
  const t = await getTranslations(translationNamespace);

  return (
    <div className="space-y-4">
      {DD_RISK_CATEGORIES.map((category) => {
        const findings = findingsByCategory[category] ?? [];
        return (
          <Card key={category} variant="elevated">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">{t(`riskCategories.${category}`)}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {findings.length === 0 ? (
                <p className="text-xs text-muted-foreground">{t("noFindingsInCategory")}</p>
              ) : (
                findings.map((finding) => (
                  <div key={finding.id} className="rounded-lg border border-border/60 bg-muted/30 p-3">
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase",
                          LEVEL_STYLES[finding.riskLevel],
                        )}
                      >
                        {t(`riskLevels.${finding.riskLevel}`)}
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed">{finding.description}</p>
                    {finding.recommendedAction ? (
                      <p className="mt-2 text-xs text-muted-foreground">{finding.recommendedAction}</p>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
