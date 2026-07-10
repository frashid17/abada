"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, UserPlus } from "lucide-react";
import { addInvestorToDealAction } from "@/lib/dd/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AddInvestorFormProps = {
  dealId: string;
};

const ERROR_KEYS = new Set(["investor_not_found", "firm_membership_required", "unauthorized", "create_failed"]);

export function AddInvestorForm({ dealId }: AddInvestorFormProps) {
  const t = useTranslations("firm.dd");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await addInvestorToDealAction({ dealId, investorEmail: email });
      if (!result.ok) {
        const key = ERROR_KEYS.has(result.error) ? result.error : "create_failed";
        setError(t(`errors.${key}` as "errors.create_failed"));
        return;
      }
      setEmail("");
      setMessage(t("investorAdded"));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h3 className="font-medium">{t("addInvestorTitle")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("addInvestorHint")}</p>
      <div className="space-y-2">
        <Label htmlFor="investor-email">{t("investorEmailLabel")}</Label>
        <Input
          id="investor-email"
          type="email"
          required
          disabled={pending}
          value={email}
          placeholder={t("investorEmailPlaceholder")}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t("addInvestorCta")}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
