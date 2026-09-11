"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setLiveEditorFabVisibleAction } from "@/lib/platform-admin/ui-copy-actions";
import { Button } from "@/components/ui/button";

export function LiveEditorSettingsPanel({ fabVisible }: { fabVisible: boolean }) {
  const t = useTranslations("admin.liveEditor");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [visible, setVisible] = useState(fabVisible);
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    const next = !visible;
    setError(null);
    startTransition(async () => {
      const result = await setLiveEditorFabVisibleAction(next);
      if (!result.ok) {
        setError(t("hideFailed"));
        return;
      }
      setVisible(next);
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <h3 className="font-serif text-lg font-semibold">{t("settingsTitle")}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{t("settingsDescription")}</p>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          {visible ? t("fabVisible") : t("fabHidden")}
        </p>
        <Button type="button" size="sm" variant="outline" disabled={pending} onClick={toggle}>
          {visible ? t("hideFab") : t("showFab")}
        </Button>
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
