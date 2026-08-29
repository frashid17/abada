"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { reviewFindingAction } from "@/lib/dd/questionnaire-actions";
import { Button } from "@/components/ui/button";

export function FindingReviewActions({ findingId }: { findingId: string }) {
  const t = useTranslations("firm.dd");
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <Button
        type="button"
        size="sm"
        variant="cta"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await reviewFindingAction(findingId, "active");
            router.refresh();
          })
        }
      >
        {t("acceptDraft")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await reviewFindingAction(findingId, "dismissed");
            router.refresh();
          })
        }
      >
        {t("dismissDraft")}
      </Button>
    </div>
  );
}
