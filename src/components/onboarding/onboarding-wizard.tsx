"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Briefcase,
  Building2,
  Loader2,
  Mail,
  Rocket,
  Users,
} from "lucide-react";
import {
  completeCreateFirmOnboarding,
  completeFounderOnboarding,
  completeInvestorOnboarding,
  completeJoinInviteOnboarding,
} from "@/lib/onboarding/actions";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type InviteInfo = {
  token: string;
  email: string;
  role: FirmMemberRole;
};

type OnboardingWizardProps = {
  userEmail: string;
  invitation: InviteInfo | null;
};

type Step = "invite" | "choose" | "create_firm";

export function OnboardingWizard({ userEmail, invitation }: OnboardingWizardProps) {
  const t = useTranslations("onboarding");
  const [step, setStep] = useState<Step>(invitation ? "invite" : "choose");
  const [firmName, setFirmName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function goTo(path: string) {
    window.location.assign(path);
  }

  function handleJoinInvite() {
    if (!invitation) return;
    startTransition(async () => {
      setError(null);
      const result = await completeJoinInviteOnboarding({ inviteToken: invitation.token });
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.invite_failed"));
        return;
      }
      goTo(result.redirect);
    });
  }

  function handleCreateFirm(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      setError(null);
      const result = await completeCreateFirmOnboarding({ firmName });
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.create_failed"));
        return;
      }
      goTo(result.redirect);
    });
  }

  function handleFounder() {
    startTransition(async () => {
      setError(null);
      const result = await completeFounderOnboarding();
      if (!result.ok) {
        setError(t("errors.generic"));
        return;
      }
      goTo(result.redirect);
    });
  }

  function handleInvestor() {
    startTransition(async () => {
      setError(null);
      const result = await completeInvestorOnboarding();
      if (!result.ok) {
        setError(t("errors.generic"));
        return;
      }
      goTo(result.redirect);
    });
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-widest text-primary">{t("eyebrow")}</p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {step === "invite" && invitation ? (
        <Card variant="elevated" className="border-primary/20">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Mail className="h-5 w-5" />
            </div>
            <CardTitle>{t("invite.title")}</CardTitle>
            <CardDescription>{t("invite.description", { email: invitation.email })}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-muted/40 p-4 text-sm">
              <p className="font-medium text-foreground">{userEmail}</p>
              <p className="mt-1 text-muted-foreground">
                {t("invite.role", { role: t(`roles.${invitation.role}`) })}
              </p>
            </div>
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button
              type="button"
              variant="cta"
              className="w-full"
              disabled={pending}
              onClick={handleJoinInvite}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("invite.cta")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="w-full"
              disabled={pending}
              onClick={() => setStep("choose")}
            >
              {t("invite.notMe")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === "choose" ? (
        <div className="grid gap-4 sm:grid-cols-3">
          <button
            type="button"
            className="group rounded-2xl border border-border/80 bg-card p-5 text-left shadow-soft transition hover:border-primary/30 hover:shadow-card"
            onClick={() => setStep("create_firm")}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Building2 className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold">{t("paths.firm.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("paths.firm.description")}</p>
          </button>

          <button
            type="button"
            className="group rounded-2xl border border-border/80 bg-card p-5 text-left shadow-soft transition hover:border-primary/30 hover:shadow-card"
            onClick={handleFounder}
            disabled={pending}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Rocket className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold">{t("paths.founder.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("paths.founder.description")}</p>
          </button>

          <button
            type="button"
            className="group rounded-2xl border border-border/80 bg-card p-5 text-left shadow-soft transition hover:border-primary/30 hover:shadow-card"
            onClick={handleInvestor}
            disabled={pending}
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Briefcase className="h-5 w-5" />
            </div>
            <h2 className="font-serif text-lg font-semibold">{t("paths.investor.title")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{t("paths.investor.description")}</p>
          </button>
        </div>
      ) : null}

      {step === "create_firm" ? (
        <Card variant="elevated">
          <CardHeader>
            <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Users className="h-5 w-5" />
            </div>
            <CardTitle>{t("createFirm.title")}</CardTitle>
            <CardDescription>{t("createFirm.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateFirm} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="firm-name">{t("createFirm.nameLabel")}</Label>
                <Input
                  id="firm-name"
                  name="firmName"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder={t("createFirm.namePlaceholder")}
                  required
                  disabled={pending}
                />
              </div>
              {error ? <p className="text-sm text-destructive">{error}</p> : null}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  disabled={pending}
                  onClick={() => setStep("choose")}
                >
                  {t("back")}
                </Button>
                <Button type="submit" variant="cta" className="flex-1" disabled={pending}>
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("createFirm.cta")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}

      {error && step === "choose" ? (
        <p className="text-center text-sm text-destructive">{error}</p>
      ) : null}
    </div>
  );
}
