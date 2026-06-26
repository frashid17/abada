"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Trash2 } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { deleteFirmDealAction } from "@/lib/dd/actions";
import { Button } from "@/components/ui/button";

type DeleteDealButtonProps = {
  dealId: string;
  dealName: string;
  redirectTo?: string;
  size?: "sm" | "default";
};

export function DeleteDealButton({
  dealId,
  dealName,
  redirectTo = "/firma/dd",
  size = "sm",
}: DeleteDealButtonProps) {
  const t = useTranslations("firm.dd");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(t("deleteConfirm", { name: dealName }))) return;

    setError(null);
    startTransition(async () => {
      const result = await deleteFirmDealAction(dealId);
      if (!result.ok) {
        setError(t("deleteError"));
        return;
      }
      router.push(redirectTo);
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        size={size}
        disabled={pending}
        onClick={handleDelete}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        {t("deleteRoom")}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
