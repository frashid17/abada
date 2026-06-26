import { getTranslations } from "next-intl/server";
import { StatCard } from "@/components/ui/stat-card";

export async function LandingStats() {
  const t = await getTranslations("public");

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {(["statDocuments", "statFirm", "statRisk"] as const).map((key) => (
        <StatCard
          key={key}
          value={t(`stats.${key}.value`)}
          label={t(`stats.${key}.label`)}
        />
      ))}
    </section>
  );
}
