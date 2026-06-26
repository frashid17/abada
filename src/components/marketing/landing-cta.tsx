import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export async function LandingCta() {
  const t = await getTranslations("public");

  return (
    <section className="surface-elevated relative overflow-hidden rounded-2xl p-8 sm:p-10">
      <div className="relative max-w-2xl space-y-4">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {t("finalCta.title")}
        </h2>
        <p className="text-muted-foreground">{t("finalCta.subtitle")}</p>
        <Button asChild size="lg" variant="cta">
          <Link href="/registro">
            {t("finalCta.button")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
