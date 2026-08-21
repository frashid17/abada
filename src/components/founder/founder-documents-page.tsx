import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { FounderDocumentsCatalogHeader } from "@/components/founder/founder-documents-catalog-header";
import { FounderDocumentsList } from "@/components/founder/founder-documents-list";
import type { FounderDashboardData } from "@/lib/documents/dashboard";
import {
  LEARN_DOCUMENT_TYPES,
  templatesPath,
} from "@/lib/documents/learn/routes";

type FounderDocumentsPageContentProps = {
  data: FounderDashboardData;
};

const GUIDE_ONLY_TYPES = LEARN_DOCUMENT_TYPES.filter(
  (type) => type !== "shareholders" && type !== "employment",
);

export async function FounderDocumentsPageContent({ data }: FounderDocumentsPageContentProps) {
  const t = await getTranslations("founder");

  return (
    <div className="space-y-10">
      <FounderDocumentsCatalogHeader data={data} />

      <FounderDocumentsList
        data={data}
        variant="catalog"
        heading={t("documentsPage.catalogHeading")}
        description={t("documentsPage.catalogDescription")}
      />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
            {t("documentsPage.guidesHeading")}
          </h2>
          <p className="text-sm text-muted-foreground">{t("documentsPage.guidesDescription")}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_ONLY_TYPES.map((documentType) => (
            <Link
              key={documentType}
              href={templatesPath(documentType)}
              className="rounded-xl border border-border/70 bg-card/60 p-4 transition-colors hover:border-primary/30 hover:bg-muted/30"
            >
              <p className="text-sm font-semibold text-foreground">
                {t(`learn.documents.${documentType}.title`)}
              </p>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                {t(`learn.documents.${documentType}.description`)}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
