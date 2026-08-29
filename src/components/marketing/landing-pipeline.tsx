import { getTranslations } from "next-intl/server";
import { DocumentPipeline } from "@/components/legal/document-pipeline";

const LANDING_DOC_KEYS = ["founders", "equity", "ip"] as const;

export async function LandingPipeline() {
  const t = await getTranslations("public");

  const steps = LANDING_DOC_KEYS.map((key, index) => ({
    step: index + 1,
    label: t(`pipeline.docs.${key}`),
  }));

  return (
    <DocumentPipeline
      title={t("pipeline.title")}
      subtitle={t("pipeline.subtitle")}
      steps={steps}
    />
  );
}
