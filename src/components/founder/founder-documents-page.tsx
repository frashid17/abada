import { getTranslations } from "next-intl/server";
import { DocumentsPrototypeHub } from "@/components/founder/documents-prototype-hub";
import { FounderDocumentsList } from "@/components/founder/founder-documents-list";
import type { FounderDashboardData } from "@/lib/documents/dashboard";

type FounderDocumentsPageContentProps = {
  data: FounderDashboardData;
};

export async function FounderDocumentsPageContent({ data }: FounderDocumentsPageContentProps) {
  const t = await getTranslations("founder");

  return (
    <DocumentsPrototypeHub
      secondary={
        <>
          <div className="space-y-1">
            <h2 className="font-serif text-xl font-semibold tracking-tight sm:text-2xl">
              {t("documentsPage.secondaryHeading")}
            </h2>
            <p className="text-sm text-muted-foreground">
              {t("documentsPage.secondaryDescription")}
            </p>
          </div>
          <FounderDocumentsList
            data={data}
            variant="catalog"
            showHeading={false}
          />
        </>
      }
    />
  );
}
