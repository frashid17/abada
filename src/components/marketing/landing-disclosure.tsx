import { getTranslations } from "next-intl/server";
import { getFirmName } from "@/lib/brand";
import { LegalDisclosure } from "@/components/legal/legal-disclosure";

export async function LandingDisclosure() {
  const t = await getTranslations("public");
  const firm = getFirmName();

  return <LegalDisclosure message={t("disclosureBanner", { firm })} />;
}
