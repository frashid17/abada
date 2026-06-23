"use client";

import Link from "next/link";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { reviewQueue } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

const priorityVariant = {
  high: "high" as const,
  medium: "medium" as const,
  low: "low" as const,
};

export default function AttorneyDashboard() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="attorney"
        userName="David Suárez"
        userRole="Abogado · Balam Legal"
      />

      <div className="flex-1 p-6 lg:p-8">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">
            {t("attorney.dashboard.title")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("attorney.dashboard.subtitle")}</p>
        </div>

        <div className="mb-6 grid gap-3 sm:grid-cols-3">
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("attorney.dashboard.inQueue")}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">7</p>
            <p className="mt-1 text-xs text-orange-600">
              {t("attorney.dashboard.dueToday", { count: "2" })}
            </p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("attorney.dashboard.signedThisMonth")}</p>
            <p className="mt-1 text-3xl font-semibold text-primary">41</p>
            <p className="mt-1 text-xs text-emerald-600">{t("attorney.dashboard.signedTrend")}</p>
          </Card>
          <Card className="p-5">
            <p className="text-sm text-muted-foreground">{t("attorney.dashboard.avgTime")}</p>
            <p className="mt-1 text-3xl font-semibold text-foreground">1,8 días</p>
            <p className="mt-1 text-xs text-muted-foreground">{t("attorney.dashboard.perDocument")}</p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">{t("attorney.dashboard.task")}</th>
                  <th className="px-4 py-3 font-medium">{t("attorney.dashboard.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("attorney.dashboard.client")}</th>
                  <th className="px-4 py-3 font-medium">{t("attorney.dashboard.priority")}</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {reviewQueue.map((task) => (
                  <tr key={task.id} className="border-b border-border/60 hover:bg-muted/50">
                    <td className="px-4 py-3.5 font-medium text-foreground">{task.title}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{task.type}</td>
                    <td className="px-4 py-3.5 text-muted-foreground">{task.client}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={priorityVariant[task.priorityVariant]}>
                        {task.priority}
                      </Badge>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Link href={task.href}>
                        <Button size="sm" variant="secondary">
                          {t("common.review")}
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <AiAssistantPanel audience="attorney" />
    </div>
  );
}
