"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Loader2, Plus } from "lucide-react";
import { createFirmDealAction } from "@/lib/dd/actions";
import type { FounderOption } from "@/lib/firm/founder-lookup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CreateDealFormProps = {
  knownFounders: FounderOption[];
};

const DEAL_ERROR_KEYS = new Set([
  "create_failed",
  "founder_not_found",
  "founder_required",
  "founder_ambiguous",
  "firm_membership_required",
  "unauthorized",
  "tenant_not_configured",
]);

function formatFounderLabel(founder: FounderOption): string {
  if (founder.displayName && founder.email) {
    return `${founder.displayName} (${founder.email})`;
  }
  return founder.displayName ?? founder.email ?? founder.clerkUserId;
}

export function CreateDealForm({ knownFounders }: CreateDealFormProps) {
  const t = useTranslations("firm.dd");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [founderMode, setFounderMode] = useState<"known" | "email">(
    knownFounders.length > 0 ? "known" : "email",
  );
  const [selectedFounderId, setSelectedFounderId] = useState(knownFounders[0]?.clerkUserId ?? "");
  const [founderEmail, setFounderEmail] = useState("");

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createFirmDealAction({
        name: String(form.get("name")),
        founderClerkId: founderMode === "known" ? selectedFounderId : undefined,
        founderEmail: founderMode === "email" ? founderEmail : undefined,
      });

      if (!result.ok) {
        const errorKey = DEAL_ERROR_KEYS.has(result.error) ? result.error : "create_failed";
        setError(t(`errors.${errorKey}` as "errors.create_failed"));
        return;
      }

      router.push(`/firma/dd/${result.dealId}`);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5">
      <h3 className="font-serif text-lg font-semibold">{t("createDealTitle")}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="deal-name">{t("dealNameLabel")}</Label>
          <Input id="deal-name" name="name" required disabled={pending} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="founder-select">{t("founderLabel")}</Label>
          {knownFounders.length > 0 ? (
            <Select
              id="founder-select"
              value={founderMode === "known" ? selectedFounderId : "__email__"}
              disabled={pending}
              onChange={(e) => {
                const value = e.target.value;
                if (value === "__email__") {
                  setFounderMode("email");
                  return;
                }
                setFounderMode("known");
                setSelectedFounderId(value);
              }}
            >
              {knownFounders.map((founder) => (
                <option key={founder.clerkUserId} value={founder.clerkUserId}>
                  {formatFounderLabel(founder)}
                </option>
              ))}
              <option value="__email__">{t("founderByEmailOption")}</option>
            </Select>
          ) : null}
          {founderMode === "email" || knownFounders.length === 0 ? (
            <Input
              id="founder-email"
              type="email"
              required
              disabled={pending}
              value={founderEmail}
              placeholder={t("founderEmailPlaceholder")}
              onChange={(e) => setFounderEmail(e.target.value)}
            />
          ) : null}
          <p className="text-xs text-muted-foreground">{t("founderHint")}</p>
        </div>
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        {t("createDealCta")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
