"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, FileText, Info } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { caseDocuments } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type RiskLevel = "low" | "medium" | "high";

const categories = [
  { id: "corporate", labelKey: "risk.categories.corporate", default: "low" as RiskLevel },
  { id: "labor", labelKey: "risk.categories.labor", default: "medium" as RiskLevel },
  { id: "litigation", labelKey: "risk.categories.litigation", default: "high" as RiskLevel },
];

export default function CaseReviewPage() {
  const { t } = useI18n();
  const [risks, setRisks] = useState<Record<string, RiskLevel>>({
    corporate: "low",
    labor: "medium",
    litigation: "high",
  });
  const [conclusion, setConclusion] = useState<RiskLevel>("medium");

  const setRisk = (id: string, level: RiskLevel) => {
    setRisks((prev) => ({ ...prev, [id]: level }));
  };

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="attorney"
        userName="David Suárez"
        userRole="Abogado · Balam Legal"
      />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <Link
          href="/abogado"
          className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t("attorney.reviewQueue")}
        </Link>

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("attorney.review.title", { company: "Nuvexa SAS" })}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {t("attorney.review.subtitle", { investor: "Andina Capital" })}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary">{t("attorney.review.saveDraft")}</Button>
            <Button variant="accent">{t("attorney.review.approveSign")}</Button>
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-3">
          <Card className="lg:col-span-1">
            <CardContent className="p-5">
              <h2 className="mb-3 text-sm font-semibold text-foreground">
                {t("attorney.review.caseDocs")}
              </h2>
              <ul className="space-y-1.5">
                {caseDocuments.map((doc) => (
                  <li
                    key={doc}
                    className="flex items-center gap-2 rounded-md bg-muted px-3 py-2 text-sm text-foreground"
                  >
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    {doc}
                  </li>
                ))}
              </ul>
              <p className="mt-4 flex items-start gap-2 text-[11px] text-muted-foreground">
                <Info className="mt-0.5 h-3 w-3 shrink-0" />
                {t("attorney.review.auditNote")}
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardContent className="p-5">
              <h2 className="mb-5 text-sm font-semibold text-foreground">
                {t("attorney.review.assignRisk")}
              </h2>
              <div className="space-y-5">
                {categories.map((cat) => (
                  <div key={cat.id}>
                    <p className="mb-2 text-sm font-medium text-foreground">
                      {t(cat.labelKey)}
                    </p>
                    <div className="flex gap-2">
                      {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setRisk(cat.id, level)}
                          className={cn(
                            "risk-pill",
                            risks[cat.id] === level
                              ? `risk-pill-active-${level}`
                              : "risk-pill-inactive",
                          )}
                        >
                          {t(`risk.${level}`)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="border-t border-border pt-5">
                  <p className="mb-2 text-sm font-medium text-foreground">
                    {t("attorney.review.globalConclusion")}
                  </p>
                  <div className="flex gap-2">
                    {(["low", "medium", "high"] as RiskLevel[]).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setConclusion(level)}
                        className={cn(
                          "risk-pill",
                          conclusion === level
                            ? `risk-pill-active-${level}`
                            : "risk-pill-inactive",
                        )}
                      >
                        {t(`risk.${level}`)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <AiAssistantPanel audience="attorney" />
    </div>
  );
}
