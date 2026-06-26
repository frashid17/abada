"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type FirmInviteAcceptProps = {
  token: string;
  email: string;
};

export function FirmInviteAccept({ token, email }: FirmInviteAcceptProps) {
  const t = useTranslations("firm.invite");

  const signUpHref = `/registro?invite=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
  const signInHref = `/iniciar-sesion?redirect_url=${encodeURIComponent(`/onboarding?invite=${token}`)}`;

  return (
    <Card variant="elevated" className="mt-6">
      <CardContent className="space-y-4 p-6">
        <p className="text-sm text-muted-foreground">{t("createAccountHint")}</p>
        <Button asChild variant="cta" className="w-full">
          <Link href={signUpHref}>
            {t("createAccountCta")}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href={signInHref} className="font-medium text-primary hover:underline">
            {t("signInLink")}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
