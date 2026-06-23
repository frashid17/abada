"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { riskCategories } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

export default function InvestorDashboard() {
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
          {t("investor.dashboard.title")}
        </h1>

        <div className="mb-6 grid gap-3 sm:grid-cols-2">
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t("investor.dashboard.activeDeals")}</p>
              <p className="mt-1 text-3xl font-semibold text-foreground">3</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{t("investor.dashboard.pendingReview")}</p>
              <p className="mt-1 text-3xl font-semibold text-primary">1</p>
            </CardContent>
          </Card>
        </div>

        <h2 className="mb-3 text-base font-semibold text-foreground">Nuvexa SAS</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {riskCategories.map((cat) => (
            <Card key={cat.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-foreground">{t(cat.nameKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(cat.descKey)}</p>
                  </div>
                  <Badge variant={cat.level}>{t(`risk.${cat.level}`)}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AiAssistantPanel audience="investor" />
    </div>
  );
}
