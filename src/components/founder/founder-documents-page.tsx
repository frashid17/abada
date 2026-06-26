import { getTranslations } from "next-intl/server";
import { FounderDocumentsCatalogHeader } from "@/components/founder/founder-documents-catalog-header";
import { FounderDocumentsList } from "@/components/founder/founder-documents-list";
import type { FounderDashboardData } from "@/lib/documents/dashboard";

type FounderDocumentsPageContentProps = {
  data: FounderDashboardData;
};

export async function FounderDocumentsPageContent({ data }: FounderDocumentsPageContentProps) {
  const t = await getTranslations("founder");

  return (
    <div className="space-y-8">
      <FounderDocumentsCatalogHeader data={data} />

      <FounderDocumentsList
        data={data}
        variant="catalog"
        heading={t("documentsPage.catalogHeading")}
        description={t("documentsPage.catalogDescription")}
      />
    </div>
  );
}
