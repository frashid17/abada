"use client";

import Link from "next/link";
import { ArrowRight, FileText } from "lucide-react";
import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { investmentDocuments } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

const statusVariant = {
  not_started: "default" as const,
  draft: "warning" as const,
  in_review: "primary" as const,
  complete: "low" as const,
};

export default function FounderDashboard() {
  const { t } = useI18n();
  const completed = investmentDocuments.filter((d) => d.status === "complete").length;

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="founder"
        userName="Valentina Soto"
        userRole="Fundadora · Nuvexa SAS"
      />

      <div className="flex-1 overflow-auto p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {t("founder.dashboard.title")}
        </h1>

        <Card className="mb-6 border-primary/20 bg-primary-subtle/40">
          <CardContent className="p-6 lg:p-7">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm font-medium text-primary">
                  {t("founder.dashboard.readiness")}
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-foreground">
                  {t("founder.dashboard.progress", {
                    completed: String(completed),
                    total: String(investmentDocuments.length),
                  })}
                </h2>
                <div className="mt-4 h-1.5 w-full max-w-md overflow-hidden rounded-full bg-border">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{
                      width: `${(completed / investmentDocuments.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <Link href="/fundador/generar">
                <Button size="lg">
                  {t("founder.dashboard.startNext")}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-3">
          {investmentDocuments.map((doc) => (
            <Card key={doc.id} className="transition hover:border-primary/25">
              <CardContent className="flex items-center gap-4 p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-foreground">{t(doc.nameKey)}</h3>
                </div>
                <Badge variant={statusVariant[doc.status]}>
                  {t(`founder.status.${doc.status}`)}
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AiAssistantPanel audience="founder" />
    </div>
  );
}
