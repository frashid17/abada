"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, UserPlus } from "lucide-react";
import { createFirmInviteAction } from "@/lib/firm/actions";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES: FirmMemberRole[] = ["admin", "partner", "associate", "of_counsel"];

export function FirmInviteForm() {
  const t = useTranslations("firm.team");
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setInviteUrl(null);
    setCopied(false);

    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const role = String(data.get("role") ?? "associate") as FirmMemberRole;

    startTransition(async () => {
      const result = await createFirmInviteAction({ email, role });
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.invite_failed"));
        return;
      }
      setInviteUrl(result.inviteUrl);
      form.reset();
    });
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5">
        <h3 className="font-serif text-lg font-semibold">{t("inviteTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("inviteDescription")}</p>

        <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t("emailLabel")}</Label>
            <Input id="invite-email" name="email" type="email" required disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">{t("roleLabel")}</Label>
            <Select id="invite-role" name="role" defaultValue="associate" disabled={pending}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
          {t("inviteCta")}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {inviteUrl ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium text-foreground">{t("linkReady")}</p>
          <p className="break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" />
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
