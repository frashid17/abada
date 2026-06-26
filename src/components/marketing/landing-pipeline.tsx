import { getTranslations } from "next-intl/server";
import { INVESTMENT_DOCUMENT_CATALOG } from "@/lib/documents/catalog";
import { DocumentPipeline } from "@/components/legal/document-pipeline";

export async function LandingPipeline() {
  const t = await getTranslations("public");
  const docs = await getTranslations("founder.documents");

  const steps = INVESTMENT_DOCUMENT_CATALOG.map((def) => ({
    step: def.step,
    label: docs(`${def.type}.title`),
  }));

  return (
    <DocumentPipeline
      title={t("pipeline.title")}
      subtitle={t("pipeline.subtitle")}
      steps={steps}
    />
  );
}
