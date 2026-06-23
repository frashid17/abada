"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/provider";

export default function InvestorDataRoomPage() {
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
          {t("investor.dataRoom")}
        </h1>
        <Card>
          <CardContent className="p-8 text-center text-sm text-muted-foreground">
            {t("investor.dataRoomPlaceholder")}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
