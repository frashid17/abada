"use client";

import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  Scale,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { riskCategories } from "@/data/mock";

export default function LandingPage() {
  const { t } = useI18n();

  return (
    <div className="page-canvas">
      <section className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge variant="primary" className="mb-5 px-3 py-1">
            {t("landing.hero.badge")}
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-[3.25rem] lg:leading-tight">
            {t("landing.hero.title")}
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            {t("landing.hero.subtitle")}
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link href="/fundador">
              <Button size="lg" className="w-full sm:w-auto">
                {t("landing.hero.ctaFounder")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/inversionista">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                {t("landing.hero.ctaInvestor")}
              </Button>
            </Link>
          </div>
          <p className="mt-7 text-sm text-muted-foreground">
            {t("common.poweredBy", { partner: t("common.partner") })}
          </p>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
            {t("landing.framework.label")}
          </span>
          {[0, 1, 2, 3].map((i) => (
            <Badge key={i} variant="default" className="text-xs">
              {t(`landing.framework.items.${i}`)}
            </Badge>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("landing.platform.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">
              {t("landing.platform.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("landing.platform.subtitle")}</p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            <Card className="transition hover:border-primary/30">
              <CardContent className="p-7">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary-subtle text-lg">
                  📋
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("landing.founderCard.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("landing.founderCard.description")}
                </p>
                <ul className="mt-5 space-y-2">
                  {["nda", "vesting", "ip", "employment", "shareholders"].map((doc) => (
                    <li key={doc} className="flex items-center gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-primary" />
                      {t(`documents.${doc}`)}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/fundador"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t("landing.founderCard.cta")}
                </Link>
              </CardContent>
            </Card>

            <Card className="transition hover:border-primary/30">
              <CardContent className="p-7">
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
                  🛡️
                </div>
                <h3 className="text-lg font-semibold text-foreground">
                  {t("landing.investorCard.title")}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t("landing.investorCard.description")}
                </p>
                <ul className="mt-5 space-y-2">
                  {[
                    "Sala de datos con control de acceso",
                    "Evaluación por taxonomía de riesgo legal",
                    "Vista que lidera con el riesgo",
                    "Trazabilidad completa de cada revisión",
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground">
                      <Shield className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/inversionista"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  {t("landing.investorCard.cta")}
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("landing.difference.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">
              {t("landing.difference.title")}
            </h2>
            <p className="mt-3 text-muted-foreground">{t("landing.difference.subtitle")}</p>
          </div>

          <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {riskCategories.map((cat) => (
              <Card key={cat.id}>
                <CardContent className="flex items-start gap-3 p-4">
                  <span className="text-xl">{cat.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{t(cat.nameKey)}</h3>
                      <Badge variant={cat.level}>{t(`risk.${cat.level}`)}</Badge>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">{t(cat.descKey)}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border bg-surface py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              {t("landing.why.eyebrow")}
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-foreground">
              {t("landing.why.title")}
            </h2>
          </div>

          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {[
              { icon: Zap, key: "fast" },
              { icon: Scale, key: "validated" },
              { icon: FileCheck2, key: "secure" },
            ].map(({ icon: Icon, key }) => (
              <div key={key} className="text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-primary-subtle">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mt-4 text-base font-semibold text-foreground">
                  {t(`landing.why.${key}.title`)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {t(`landing.why.${key}.description`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="pb-20 pt-4">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <div className="rounded-2xl bg-accent px-8 py-12 text-center text-accent-foreground">
            <h2 className="text-2xl font-semibold sm:text-3xl">
              {t("landing.cta.title")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm text-slate-300">
              {t("landing.cta.subtitle")}
            </p>
            <Link href="/fundador" className="mt-7 inline-block">
              <Button variant="primary" size="lg" className="bg-primary hover:bg-primary-hover">
                {t("landing.cta.button")}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        {t("landing.footer")}
      </footer>
    </div>
  );
}
