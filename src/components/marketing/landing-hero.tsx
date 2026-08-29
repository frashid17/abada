import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { ArrowRight, FileText, Scale, ShieldCheck, Stamp } from "lucide-react";
import { FeaturePanel } from "@/components/legal/feature-panel";
import { LegalBadge } from "@/components/legal/legal-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type LandingHeroProps = {
  isSignedIn: boolean;
};

export async function LandingHero({ isSignedIn }: LandingHeroProps) {
  const t = await getTranslations("public");

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

        <div className="grid gap-4 sm:grid-cols-2">
          <FeaturePanel
            className="sm:col-span-2"
            tone="trust"
            icon={ShieldCheck}
            eyebrow={t("securityCard.eyebrow")}
            title={t("securityCard.title")}
            description={t("securityCard.body")}
          />

          <Card variant="feature" className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">{t("heroCard.title")}</CardTitle>
              <CardDescription>{t("heroCard.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(
                [
                  { icon: FileText, key: "documents" },
                  { icon: ShieldCheck, key: "review" },
                  { icon: Scale, key: "diligence" },
                ] as const
              ).map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3.5 py-2.5"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium leading-snug text-foreground">
                    {t(`heroCard.items.${key}`)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
