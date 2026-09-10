import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, FileText, Scale, ShieldCheck, Stamp } from "lucide-react";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalBadge } from "@/components/legal/legal-badge";
import { Button } from "@/components/ui/button";

type LandingHeroProps = {
  isSignedIn: boolean;
};

export async function LandingHero({ isSignedIn }: LandingHeroProps) {
  const t = await getTranslations("public");

  const readinessItems = [
    { icon: FileText, key: "documents" },
    { icon: ShieldCheck, key: "review" },
    { icon: Scale, key: "diligence" },
  ] as const;

  return (
    <section>
      <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-14">
        <div className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <LegalBadge icon={ShieldCheck} label={t("trustBadge")} variant="attorney" />
            <LegalBadge icon={Stamp} label={t("compliance.colombia")} variant="confidential" />
          </div>
          <h1 className="font-serif text-4xl font-semibold leading-[1.08] tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem]">
            {t("headline")}
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">{t("subheadline")}</p>
          <div className="flex flex-wrap gap-3 pt-1">
            <Button asChild size="lg" variant="cta">
              <Link href="/registro">
                {t("ctaFounder")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/registro">{t("ctaInvestor")}</Link>
            </Button>
            {!isSignedIn ? (
              <Button asChild variant="ghost" size="lg">
                <Link href="/iniciar-sesion?redirect_url=/firma">{t("ctaFirm")}</Link>
              </Button>
            ) : null}
          </div>
        </div>

        <FeaturePanel
          tone="trust"
          icon={ShieldCheck}
          eyebrow={t("securityCard.eyebrow")}
          title={t("securityCard.title")}
          description={t("securityCard.body")}
          className="h-full"
        >
          <div className="space-y-3 border-t border-trust-panel-accent/20 pt-5">
            <div className="space-y-1">
              <p className="text-sm font-semibold text-trust-panel-foreground">
                {t("heroCard.title")}
              </p>
              <p className="text-sm text-trust-panel-muted">{t("heroCard.description")}</p>
            </div>
            <ul className="grid gap-2.5">
              {readinessItems.map(({ icon: Icon, key }) => (
                <li
                  key={key}
                  className="flex items-center gap-3 rounded-xl border border-trust-panel-accent/20 bg-trust-panel-icon-bg/55 px-3.5 py-3"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-trust-panel-accent/15 text-trust-panel-accent ring-1 ring-trust-panel-accent/25">
                    <Icon className="h-4 w-4" aria-hidden />
                  </div>
                  <span className="text-sm font-medium leading-snug text-trust-panel-foreground">
                    {t(`heroCard.items.${key}`)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </FeaturePanel>
      </div>
    </section>
  );
}
