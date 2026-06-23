"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { investmentDocuments } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

export default function GenerateDocumentPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="founder"
        userName="Valentina Soto"
        userRole="Fundadora · Nuvexa SAS"
      />
      <div className="flex-1 p-6 lg:p-8">
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          {t("founder.generate")}
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">{t("founder.generateIntro")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {investmentDocuments.map((doc) => (
            <Card key={doc.id} className="transition hover:border-primary/30">
              <CardContent className="p-5">
                <h3 className="font-medium text-foreground">{t(doc.nameKey)}</h3>
                <Button className="mt-4" size="sm">
                  {t("founder.start")}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <AiAssistantPanel audience="founder" />
    </div>
  );
}
