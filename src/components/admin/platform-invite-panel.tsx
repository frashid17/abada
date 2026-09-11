"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Mail } from "lucide-react";
import { createPlatformInviteAction } from "@/lib/platform-admin/invite-actions";
import type { PlatformInvitationRecord, PlatformInviteRole } from "@/lib/platform-admin/invitations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES: PlatformInviteRole[] = ["founder", "investor", "firm"];

export function PlatformInvitePanel({
  invitations,
  emailConfigured,
}: {
  invitations: PlatformInvitationRecord[];
  emailConfigured: boolean;
}) {
  const t = useTranslations("admin.invites");
  const [pending, startTransition] = useTransition();
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setInviteUrl(null);
    setEmailSent(false);
    setCopied(false);

    const data = new FormData(form);
    const email = String(data.get("email") ?? "");
    const role = String(data.get("role") ?? "founder");

    startTransition(async () => {
      const result = await createPlatformInviteAction({ email, role });
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.invite_failed"));
        return;
      }
      setInviteUrl(result.inviteUrl);
      setEmailSent(result.emailSent);
      if (!result.emailSent) {
        setError(
          t(
            `errors.${(result.emailError === "email_not_configured"
              ? "email_not_configured"
              : "email_send_failed") as "email_not_configured"}`,
          ),
        );
      }
      form.reset();
    });
  }

  async function copyLink() {
    if (!inviteUrl) return;
    await navigator.clipboard.writeText(inviteUrl);
    setCopied(true);
  }

  return (
    <div className="space-y-8">
      {!emailConfigured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-foreground">
          {t("smtpMissing")}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-2xl border border-border/70 bg-muted/30 p-5"
      >
        <h3 className="font-serif text-lg font-semibold">{t("formTitle")}</h3>
        <p className="text-sm text-muted-foreground">{t("formDescription")}</p>

        <div className="grid gap-4 sm:grid-cols-[1fr_180px]">
          <div className="space-y-2">
            <Label htmlFor="platform-invite-email">{t("emailLabel")}</Label>
            <Input
              id="platform-invite-email"
              name="email"
              type="email"
              required
              disabled={pending}
              placeholder={t("emailPlaceholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="platform-invite-role">{t("roleLabel")}</Label>
            <Select id="platform-invite-role" name="role" defaultValue="founder" disabled={pending}>
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {t(`roles.${role}`)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <Button type="submit" size="sm" disabled={pending}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {t("submit")}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {inviteUrl ? (
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {emailSent ? t("emailSent") : t("linkReady")}
          </p>
          <p className="break-all font-mono text-xs text-muted-foreground">{inviteUrl}</p>
          <Button type="button" variant="outline" size="sm" onClick={() => void copyLink()}>
            <Copy className="h-4 w-4" />
            {copied ? t("copied") : t("copyLink")}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        <h3 className="font-serif text-lg font-semibold">{t("listTitle")}</h3>
        {invitations.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border/60">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-border/60 bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("colEmail")}</th>
                  <th className="px-4 py-3 font-medium">{t("colRole")}</th>
                  <th className="px-4 py-3 font-medium">{t("colStatus")}</th>
                  <th className="px-4 py-3 font-medium">{t("colWhen")}</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((row) => {
                  const expired = new Date(row.expiresAt).getTime() <= Date.now();
                  const status = row.acceptedAt
                    ? t("statusAccepted")
                    : expired
                      ? t("statusExpired")
                      : t("statusPending");
                  return (
                    <tr key={row.id} className="border-b border-border/40 last:border-0">
                      <td className="px-4 py-3">{row.email}</td>
                      <td className="px-4 py-3">{t(`roles.${row.role}`)}</td>
                      <td className="px-4 py-3">{status}</td>
                      <td className="px-4 py-3 tabular-nums text-muted-foreground">
                        {new Date(row.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
