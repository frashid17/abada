"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Copy, Loader2, Mail } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { EmailChipInput } from "@/components/admin/email-chip-input";
import {
  createPlatformInvitesAction,
  type BulkInviteResultItem,
} from "@/lib/platform-admin/invite-actions";
import type { PlatformInvitationRecord, PlatformInviteRole } from "@/lib/platform-admin/invitations";
import { Button } from "@/components/ui/button";
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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [emails, setEmails] = useState<string[]>([]);
  const [results, setResults] = useState<BulkInviteResultItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [nowMs] = useState(() => Date.now());

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    setError(null);
    setResults(null);
    setCopiedEmail(null);

    if (emails.length === 0) {
      setError(t("errors.invalid_email"));
      return;
    }

    const data = new FormData(form);
    const role = String(data.get("role") ?? "founder");

    startTransition(async () => {
      const result = await createPlatformInvitesAction({
        emails: emails.join(","),
        role,
      });
      if (!result.ok) {
        setError(t(`errors.${result.error}` as "errors.invite_failed"));
        return;
      }
      setResults(result.results);
      const anyEmailIssue = result.results.some((item) => item.ok && !item.emailSent);
      if (anyEmailIssue && !emailConfigured) {
        setError(t("errors.email_not_configured"));
      }
      setEmails([]);
      form.reset();
      router.refresh();
    });
  }

  async function copyLink(email: string, url: string) {
    await navigator.clipboard.writeText(url);
    setCopiedEmail(email);
  }

  const sentCount = results?.filter((r) => r.ok && r.emailSent).length ?? 0;
  const createdCount = results?.filter((r) => r.ok).length ?? 0;

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
            <Label htmlFor="platform-invite-emails">{t("emailLabel")}</Label>
            <EmailChipInput
              id="platform-invite-emails"
              value={emails}
              onChange={setEmails}
              disabled={pending}
              placeholder={t("emailChipPlaceholder")}
            />
            <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
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

        <Button type="submit" size="sm" disabled={pending || emails.length === 0}>
          {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
          {t("submit")}
        </Button>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </form>

      {results && results.length > 0 ? (
        <div className="space-y-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-sm font-medium text-foreground">
            {t("bulkSummary", { created: createdCount, sent: sentCount })}
          </p>
          <ul className="space-y-3">
            {results.map((item) => (
              <li
                key={item.email}
                className="rounded-lg border border-border/60 bg-background/70 px-3 py-2 text-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{item.email}</span>
                  <span className="text-xs text-muted-foreground">
                    {!item.ok
                      ? t(`errors.${item.error}` as "errors.invite_failed")
                      : item.emailSent
                        ? t("statusEmailSent")
                        : t("statusLinkOnly")}
                  </span>
                </div>
                {item.ok ? (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <p className="min-w-0 flex-1 break-all font-mono text-xs text-muted-foreground">
                      {item.inviteUrl}
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyLink(item.email, item.inviteUrl)}
                    >
                      <Copy className="h-4 w-4" />
                      {copiedEmail === item.email ? t("copied") : t("copyLink")}
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
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
                  const expired = new Date(row.expiresAt).getTime() <= nowMs;
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
