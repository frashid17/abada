"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { toggleCorpusVisibilityAction } from "@/lib/platform-admin/actions";

type CorpusVisibilityToggleProps = {
  sourceId: string;
  founderVisible: boolean;
};

export function CorpusVisibilityToggle({
  sourceId,
  founderVisible,
}: CorpusVisibilityToggleProps) {
  const t = useTranslations("admin.corpus");
  const [pending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      size="sm"
      variant={founderVisible ? "outline" : "cta"}
      disabled={pending}
      onClick={() => {
        startTransition(async () => {
          await toggleCorpusVisibilityAction(sourceId, !founderVisible);
        });
      }}
    >
      {founderVisible ? t("hide") : t("show")}
    </Button>
  );
}
