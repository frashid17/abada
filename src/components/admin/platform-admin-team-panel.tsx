"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  addPlatformAdminAction,
  removePlatformAdminAction,
} from "@/lib/platform-admin/cms-actions";
import type { AdminPlatformAdminRow } from "@/lib/platform-admin/ops-cms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PlatformAdminTeamPanel({ admins }: { admins: AdminPlatformAdminRow[] }) {
  const t = useTranslations("admin.team");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleAdd(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await addPlatformAdminAction(email, displayName);
      if (!result.ok) setError(result.error);
      else {
        setEmail("");
        setDisplayName("");
        router.refresh();
      }
    });
  }

  function handleRemove(id: string) {
    startTransition(async () => {
      await removePlatformAdminAction(id);
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleAdd} className="grid max-w-lg gap-4">
        <div className="space-y-2">
          <Label htmlFor="adminEmail">{t("email")}</Label>
          <Input
            id="adminEmail"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="displayName">{t("displayName")}</Label>
          <Input id="displayName" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <Button type="submit" variant="cta" disabled={pending}>
          {t("add")}
        </Button>
      </form>
      <div className="divide-y divide-border rounded-xl border border-border">
        {admins.map((admin) => (
          <div key={admin.clerkUserId} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">
                {admin.displayName ?? admin.email ?? admin.clerkUserId}
              </p>
              <p className="text-sm text-muted-foreground">
                {admin.email ?? admin.clerkUserId}
              </p>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => handleRemove(admin.clerkUserId)}
            >
              {t("remove")}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
