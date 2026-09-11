"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2 } from "lucide-react";
import { redeemPlatformInviteAction } from "@/lib/platform-admin/invite-actions";
import { Button } from "@/components/ui/button";

export function PlatformInviteAccept({
  token,
  email,
  roleLabel,
  valid,
}: {
  token: string;
  email: string;
  roleLabel: string;
  valid: boolean;
}) {
  const t = useTranslations("admin.inviteAccept");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function accept() {
    setError(null);
    startTransition(async () => {
      const result = await redeemPlatformInviteAction(token);
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.redeem_failed"));
        return;
      }
      router.push(result.redirect);
      router.refresh();
    });
  }

  if (!valid) {
    return (
      <div className="mx-auto max-w-lg space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-8 text-center">
        <h1 className="font-serif text-2xl font-semibold">{t("invalidTitle")}</h1>
        <p className="text-sm text-muted-foreground">{t("invalidBody")}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6 rounded-2xl border border-border/70 bg-muted/20 p-8">
      <div className="space-y-2 text-center">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {t("eyebrow")}
        </p>
        <h1 className="font-serif text-2xl font-semibold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("description", { email, role: roleLabel })}
        </p>
      </div>
      <Button className="w-full" disabled={pending} onClick={accept}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t("acceptCta")}
      </Button>
      {error ? <p className="text-center text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
