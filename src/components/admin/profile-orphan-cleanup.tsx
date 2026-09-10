"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  cleanupOrphanedProfilesAction,
  previewOrphanedProfilesAction,
} from "@/lib/platform-admin/cms-actions";
import type { OrphanCleanupPreview } from "@/lib/platform-admin/profile-cleanup";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ProfileOrphanCleanup() {
  const t = useTranslations("admin.team.cleanup");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [preview, setPreview] = useState<OrphanCleanupPreview | null>(null);
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function runPreview() {
    setError(null);
    setSuccess(null);
    setConfirm("");
    startTransition(async () => {
      const result = await previewOrphanedProfilesAction();
      if (!result.ok) {
        setError(result.error);
        setPreview(null);
        return;
      }
      setPreview(result.preview);
    });
  }

  function runCleanup() {
    if (!preview) return;
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await cleanupOrphanedProfilesAction(confirm);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSuccess(
        t("deleted", {
          count: result.result.deletedCount,
          skipped: result.result.skipped.length,
        }),
      );
      setPreview(null);
      setConfirm("");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div className="space-y-1">
        <h2 className="font-serif text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-3.5 py-3 text-sm text-muted-foreground">
        <p>{t("localhostNote")}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={pending} onClick={runPreview}>
          {t("preview")}
        </Button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {success ? <p className="text-sm text-good">{success}</p> : null}

      {preview ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs font-medium">
            <span className="rounded-full border border-border px-2.5 py-1">
              {t("clerkMode", { mode: preview.clerkMode })}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {t("counts", {
                clerk: preview.clerkUserCount,
                profiles: preview.profileCount,
                orphans: preview.orphans.length,
              })}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {t("removable", { count: preview.removableCount })}
            </span>
            <span className="rounded-full border border-border px-2.5 py-1">
              {t("blocked", { count: preview.blockedCount })}
            </span>
          </div>

          {preview.warnings.map((warning) => (
            <p
              key={warning}
              className="rounded-lg border border-[color-mix(in_oklch,var(--risk-med)_35%,transparent)] bg-[color-mix(in_oklch,var(--risk-med)_10%,transparent)] px-3.5 py-3 text-sm"
            >
              {warning}
            </p>
          ))}

          {preview.orphans.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("none")}</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2">{t("colUser")}</th>
                    <th className="px-3 py-2">{t("colRelated")}</th>
                    <th className="px-3 py-2">{t("colStatus")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {preview.orphans.map((orphan) => (
                    <tr key={orphan.clerkUserId}>
                      <td className="px-3 py-2 align-top">
                        <p className="font-medium">
                          {orphan.displayName ?? orphan.email ?? orphan.clerkUserId}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {orphan.email ?? "—"} · {orphan.clerkUserId}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                        {t("relatedSummary", {
                          documents: orphan.related.documents,
                          memberships: orphan.related.memberships,
                          reviews: orphan.related.reviews,
                          deals: orphan.related.dealParticipants,
                          questionnaires: orphan.related.questionnaires,
                        })}
                      </td>
                      <td className="px-3 py-2 align-top text-xs">
                        {orphan.removable ? (
                          <span className="text-good">{t("statusRemovable")}</span>
                        ) : (
                          <span className="text-[color-mix(in_oklch,var(--risk-med)_70%,var(--fg))]">
                            {t(`blockedReason.${orphan.blockedReason ?? "blocked"}`)}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {preview.removableCount > 0 && preview.clerkMode !== "unknown" ? (
            <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
              <p className="text-sm text-muted-foreground">
                {t("confirmHint", { phrase: preview.confirmPhrase })}
              </p>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-[220px] flex-1 space-y-1">
                  <label htmlFor="cleanupConfirm" className="text-sm font-medium">
                    {t("confirmLabel")}
                  </label>
                  <Input
                    id="cleanupConfirm"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder={preview.confirmPhrase}
                    autoComplete="off"
                    spellCheck={false}
                  />
                </div>
                  <Button
                  type="button"
                  variant="outline"
                  disabled={pending || confirm !== preview.confirmPhrase}
                  onClick={runCleanup}
                >
                  {t("deleteRemovable", { count: preview.removableCount })}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
