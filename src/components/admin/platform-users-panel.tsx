"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  setUserContextAction,
  setUserPlatformAdminAction,
} from "@/lib/platform-admin/cms-actions";
import type { AdminUserRow } from "@/lib/platform-admin/ops-cms";
import type { UserContext } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export function PlatformUsersPanel({ users }: { users: AdminUserRow[] }) {
  const t = useTranslations("admin.team");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const hay = `${user.displayName ?? ""} ${user.email ?? ""} ${user.context}`.toLowerCase();
      return hay.includes(q);
    });
  }, [users, query]);

  function setAdmin(clerkUserId: string, enabled: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await setUserPlatformAdminAction(clerkUserId, enabled);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  function setContext(clerkUserId: string, context: UserContext) {
    setError(null);
    startTransition(async () => {
      const result = await setUserContextAction(clerkUserId, context);
      if (!result.ok) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-[220px] flex-1 space-y-1">
          <label htmlFor="userSearch" className="text-sm font-medium">
            {t("search")}
          </label>
          <Input
            id="userSearch"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("searchPlaceholder")}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          {t("userCount", { count: filtered.length })}
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-border bg-muted/40 text-[11px] font-bold uppercase tracking-[0.08em] text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("colUser")}</th>
              <th className="px-4 py-3">{t("colAccess")}</th>
              <th className="px-4 py-3">{t("colAdmin")}</th>
              <th className="px-4 py-3">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                  {t("empty")}
                </td>
              </tr>
            ) : (
              filtered.map((user) => (
                <tr key={user.clerkUserId}>
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-foreground">
                      {user.displayName ?? user.email ?? user.clerkUserId}
                    </p>
                    <p className="text-muted-foreground">{user.email ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Select
                      className="h-9 w-[140px]"
                      value={user.context}
                      disabled={pending}
                      onChange={(e) => setContext(user.clerkUserId, e.target.value as UserContext)}
                    >
                      <option value="founder">{t("contexts.founder")}</option>
                      <option value="investor">{t("contexts.investor")}</option>
                      <option value="firm">{t("contexts.firm")}</option>
                    </Select>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {user.onboardingComplete ? t("onboarded") : t("notOnboarded")}
                    </p>
                  </td>
                  <td className="px-4 py-3 align-top">
                    {user.isPlatformAdmin ? (
                      <span className="inline-flex rounded-md border border-good-line bg-good-bg px-2 py-0.5 text-xs font-semibold text-good">
                        {t("adminYes")}
                        {user.adminSource === "env" ? ` · ${t("sourceEnv")}` : ""}
                      </span>
                    ) : (
                      <span className="inline-flex rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
                        {t("adminNo")}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    {user.isPlatformAdmin ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={pending || user.adminSource === "env"}
                        title={user.adminSource === "env" ? t("envLocked") : undefined}
                        onClick={() => setAdmin(user.clerkUserId, false)}
                      >
                        {t("revokeAdmin")}
                      </Button>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        variant="cta"
                        disabled={pending}
                        onClick={() => setAdmin(user.clerkUserId, true)}
                      >
                        {t("makeAdmin")}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
