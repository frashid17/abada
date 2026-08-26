import { getTranslations } from "next-intl/server";
import { Inbox } from "lucide-react";
import { DD_RISK_CATEGORIES, type DdRiskLevel } from "@/lib/dd/taxonomy";
import type { FindingRecord } from "@/lib/dd/findings";
import { cn } from "@/lib/utils";

const LEVEL_INK: Record<DdRiskLevel, string> = {
  bajo: "var(--good)",
  medio: "var(--highlight)",
  alto: "var(--risk-high)",
  info_requerida: "var(--fg-muted)",
};

const LEVEL_BADGE: Record<DdRiskLevel, string> = {
  bajo: "bg-good text-primary-foreground",
  medio: "bg-highlight text-highlight-fg",
  alto: "bg-risk-high text-primary-foreground",
  info_requerida: "bg-muted text-muted-foreground",
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

  const flatFindings = DD_RISK_CATEGORIES.flatMap((category) =>
    (findingsByCategory[category] ?? []).map((finding) => ({ category, finding })),
  );
  const total = flatFindings.length;

  return (
    <div className="overflow-hidden rounded-[10px] border border-border bg-card shadow-sm">
      <div className="flex flex-wrap gap-2 border-b border-[color:var(--line-2)] bg-rail px-4 py-3">
        {DD_RISK_CATEGORIES.map((category) => {
          const count = findingsByCategory[category]?.length ?? 0;
          return (
            <span
              key={category}
              className={cn(
                "inline-flex items-center gap-1.5 border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
                count > 0
                  ? "border-accent-line bg-accent-soft text-accent-fg"
                  : "border-border bg-card text-muted-foreground",
              )}
            >
              {t(`riskCategories.${category}`)}
              <span className="tabular-nums">{count}</span>
            </span>
          );
        })}
      </div>

      {total === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 px-6 py-14 text-center">
          <div className="flex h-12 w-12 items-center justify-center bg-muted text-muted-foreground">
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
        <ul className="px-4 sm:px-6">
          {flatFindings.map(({ category, finding }, index) => {
            const ink = LEVEL_INK[finding.riskLevel];
            const showCategory =
              index === 0 || flatFindings[index - 1]?.category !== category;
            const evidenceParts = [
              finding.legalCitation,
              finding.sourcePage != null
                ? t("findingPage", { page: finding.sourcePage })
                : null,
            ].filter(Boolean);

            return (
              <li key={finding.id}>
                {showCategory ? (
                  <p className="pt-5 text-[11px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {t(`riskCategories.${category}`)}
                  </p>
                ) : null}
                <div className="grid gap-3 border-b border-[color:var(--line-2)] py-6 last:border-b-0 sm:grid-cols-[132px_minmax(0,1fr)] sm:gap-x-8">
                  <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5">
                    <span
                      className={cn(
                        "inline-grid min-w-[34px] place-items-center px-2 py-1 text-sm font-bold tabular-nums",
                        LEVEL_BADGE[finding.riskLevel],
                      )}
                    >
                      {index + 1}
                    </span>
                    <span
                      className="text-[11.5px] font-bold uppercase tracking-[0.08em]"
                      style={{ color: ink }}
                    >
                      {t(`riskLevels.${finding.riskLevel}`)}
                    </span>
                  </div>

                  <div className="border-l-2 pl-4 sm:pl-5" style={{ borderColor: ink }}>
                    <h4 className="font-serif text-lg font-semibold leading-snug tracking-tight text-foreground">
                      {finding.description}
                    </h4>
                    {finding.recommendedAction ? (
                      <p className="mt-2 max-w-[74ch] text-[15px] leading-relaxed text-[color:var(--ink-2)]">
                        {finding.recommendedAction}
                      </p>
                    ) : null}

                    <div className="mt-4 grid max-w-[900px] gap-4 border-t border-[color:var(--line-2)] pt-3.5 sm:grid-cols-3 sm:gap-6">
                      <MetaCell
                        label={t("findingMetaImpact")}
                        value={t(`riskCategories.${finding.riskCategory}`)}
                      />
                      <MetaCell
                        label={t("findingMetaAction")}
                        value={finding.recommendedAction ?? t("findingMetaUnset")}
                      />
                      <MetaCell
                        label={t("findingMetaEvidence")}
                        value={
                          evidenceParts.length > 0
                            ? evidenceParts.join(" · ")
                            : t("findingMetaUnset")
                        }
                      />
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </p>
      <p className="text-[14.5px] leading-snug text-[color:var(--ink-2)]">{value}</p>
    </div>
  );
}
