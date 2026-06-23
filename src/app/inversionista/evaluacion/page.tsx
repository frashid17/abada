"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { riskCategories } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

export default function InvestorRiskPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="investor"
        userName="Mateo Cárdenas"
        userRole="Socio · Andina Capital"
      />
      <div className="flex-1 p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {t("investor.riskEval")}
        </h1>
        <Card className="mb-5 border-orange-200 bg-orange-50/60">
          <CardContent className="p-5">
            <p className="text-sm font-medium text-orange-900">{t("investor.executiveSummary")}</p>
            <p className="mt-2 text-sm leading-relaxed text-foreground">
              {t("investor.executiveSummaryText")}
            </p>
            <Link
              href="/abogado/revision/nuvexa"
              className="mt-3 inline-block text-sm font-medium text-primary hover:underline"
            >
              {t("investor.viewFullAssessment")}
            </Link>
          </CardContent>
        </Card>
        <div className="space-y-2">
          {riskCategories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{t(cat.nameKey)}</span>
                <Badge variant={cat.level}>{t(`risk.${cat.level}`)}</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
