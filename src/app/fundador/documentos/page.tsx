"use client";

import { AppSidebar } from "@/components/layout/app-sidebar";
import { AiAssistantPanel } from "@/components/ai/assistant-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { investmentDocuments } from "@/data/mock";
import { useI18n } from "@/lib/i18n/provider";

export default function FounderDocumentsPage() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <AppSidebar
        role="founder"
        userName="Valentina Soto"
        userRole="Fundadora · Nuvexa SAS"
      />
      <div className="flex-1 p-6 lg:p-8">
        <h1 className="mb-6 text-xl font-semibold text-foreground">
          {t("founder.documents")}
        </h1>
        <div className="grid gap-3">
          {investmentDocuments.map((doc) => (
            <Card key={doc.id}>
              <CardContent className="flex items-center justify-between p-4">
                <span className="font-medium">{t(doc.nameKey)}</span>
                <Badge variant={doc.complexity === "high" ? "high" : doc.complexity === "medium" ? "medium" : "low"}>
                  {doc.complexity}
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
