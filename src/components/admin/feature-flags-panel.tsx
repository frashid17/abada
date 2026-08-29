"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setFeatureFlagAction } from "@/lib/platform-admin/cms-actions";
import type { FeatureFlag } from "@/lib/feature-flags";
import { getFeatureFlags } from "@/lib/feature-flags";
import { Button } from "@/components/ui/button";

const FLAG_KEYS = Object.keys(getFeatureFlags()) as FeatureFlag[];

export function FeatureFlagsPanel({
  overrides,
}: {
  overrides: Record<string, boolean>;
}) {
  const t = useTranslations("admin.flags");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const envDefaults = getFeatureFlags();

  function toggle(flag: FeatureFlag) {
    const current = flag in overrides ? overrides[flag]! : envDefaults[flag];
    startTransition(async () => {
      await setFeatureFlagAction(flag, !current);
      router.refresh();
    });
  }

  return (
    <div className="divide-y divide-border rounded-xl border border-border">
      {FLAG_KEYS.map((flag) => {
        const enabled = flag in overrides ? overrides[flag]! : envDefaults[flag];
        const source = flag in overrides ? t("sourceDb") : t("sourceEnv");
        return (
          <div key={flag} className="flex items-center justify-between gap-4 px-4 py-3">
            <div>
              <p className="font-medium">{flag}</p>
              <p className="text-sm text-muted-foreground">
                {enabled ? t("on") : t("off")} · {source}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => toggle(flag)}>
              {t("toggle")}
            </Button>
          </div>
        );
      })}
    </div>
  );
}
