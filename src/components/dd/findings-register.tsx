import { getTranslations } from "next-intl/server";
import { Inbox } from "lucide-react";
import { DD_RISK_CATEGORIES, type DdRiskLevel } from "@/lib/dd/taxonomy";
import type { FindingRecord } from "@/lib/dd/findings";
import { cn } from "@/lib/utils";

const LEVEL_STYLES: Record<DdRiskLevel, string> = {
  bajo: "border-risk-low/35 bg-risk-low/10 text-risk-low",
  medio: "border-risk-med/35 bg-risk-med/10 text-risk-med",
  alto: "border-risk-high/35 bg-risk-high/10 text-risk-high",
  info_requerida: "border-primary/35 bg-primary/10 text-primary",
};

type FindingsRegisterProps = {
  findingsByCategory: Record<string, FindingRecord[]>;
  translationNamespace?: "firm.dd" | "investor.room";
};

export async function FindingsRegister({
  findingsByCategory,
  translationNamespace = "firm.dd",
}: FindingsRegisterProps) {
  const t = await getTranslations(translationNamespace);

  const categoriesWithFindings = DD_RISK_CATEGORIES.filter(
    (category) => (findingsByCategory[category] ?? []).length > 0,
  );
  const total = DD_RISK_CATEGORIES.reduce(
    (sum, category) => sum + (findingsByCategory[category]?.length ?? 0),
    0,
  );

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card">
      <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-3">
        {DD_RISK_CATEGORIES.map((category) => {
          const count = findingsByCategory[category]?.length ?? 0;
          return (
            <span
              key={category}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                count > 0
                  ? "border-primary/30 bg-primary/10 text-foreground"
                  : "border-border/50 bg-muted/20 text-muted-foreground",
              )}
            >
              {t(`riskCategories.${category}`)}
              <span
                className={cn(
                  "tabular-nums",
                  count > 0 ? "text-primary" : "text-muted-foreground/80",
                )}
              >
                {count}
              </span>
            </span>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted/40 text-muted-foreground">
            <Inbox className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{t("findingsEmptyTitle")}</p>
            <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
              {t("findingsEmptyDescription")}
            </p>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-border/50">
          {categoriesWithFindings.map((category) => {
            const findings = findingsByCategory[category] ?? [];
            return (
              <div key={category} className="px-4 py-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {t(`riskCategories.${category}`)}
                  </h3>
                  <span className="text-[11px] tabular-nums text-muted-foreground">
                    {findings.length}
                  </span>
                </div>
                <ul className="space-y-2.5">
                  {findings.map((finding) => (
                    <li
                      key={finding.id}
                      className="rounded-xl border border-border/55 bg-muted/15 px-3.5 py-3"
                    >
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={cn(
                            "rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
                            LEVEL_STYLES[finding.riskLevel],
                          )}
                        >
                          {t(`riskLevels.${finding.riskLevel}`)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground">{finding.description}</p>
                      {finding.recommendedAction ? (
                        <p className="mt-2 border-t border-border/40 pt-2 text-xs leading-relaxed text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {t("recommendedActionShort")}:{" "}
                          </span>
                          {finding.recommendedAction}
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
