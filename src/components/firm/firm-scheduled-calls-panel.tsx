"use client";

import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { updateScheduledCallStatusAction } from "@/lib/scheduled-calls/actions";
import type { ScheduledCallRecord } from "@/lib/scheduled-calls/service";
import { Button } from "@/components/ui/button";

type FirmScheduledCallsPanelProps = {
  calls: ScheduledCallRecord[];
};

export function FirmScheduledCallsPanel({ calls }: FirmScheduledCallsPanelProps) {
  const t = useTranslations("firm.calls");
  const [pending, startTransition] = useTransition();

  function updateStatus(callId: string, status: "completed" | "cancelled") {
    startTransition(async () => {
      await updateScheduledCallStatusAction({ callId, status });
    });
  }

  if (calls.length === 0) {
    return (
      <section className="rounded-2xl border border-border/70 bg-muted/20 p-4">
        <h3 className="font-serif text-lg font-semibold">{t("title")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">{t("empty")}</p>
      </section>
    );
  }

  return (
    <section className="space-y-3 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <h3 className="font-serif text-lg font-semibold">{t("title")}</h3>
      <ul className="space-y-3">
        {calls.map((call) => (
          <li key={call.id} className="rounded-xl border border-border/60 bg-background p-3 text-sm">
            <p className="font-medium">{new Date(call.scheduledAt).toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">{t(`status.${call.status}`)}</p>
            {call.status === "scheduled" ? (
              <div className="mt-2 flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={pending}
                  onClick={() => updateStatus(call.id, "completed")}
                >
                  {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("markCompleted")}
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={pending}
                  onClick={() => updateStatus(call.id, "cancelled")}
                >
                  {t("markCancelled")}
                </Button>
              </div>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
