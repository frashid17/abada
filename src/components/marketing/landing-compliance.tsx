import { getTranslations } from "next-intl/server";
import { Fingerprint, Globe2, Lock, ShieldCheck } from "lucide-react";
import { ComplianceStrip } from "@/components/legal/compliance-strip";

export async function LandingCompliance() {
  const t = await getTranslations("public");

  return (
    <ComplianceStrip
      items={[
        { icon: ShieldCheck, label: t("compliance.attorney") },
        { icon: Lock, label: t("compliance.tenant") },
        { icon: Fingerprint, label: t("compliance.audit") },
        { icon: Globe2, label: t("compliance.colombia") },
      ]}
    />
  );
}
