"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CalendarClock, Loader2 } from "lucide-react";
import { requestScheduledCallAction } from "@/lib/scheduled-calls/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ScheduleCallFormProps = {
  dealId: string;
};

export function ScheduleCallForm({ dealId }: ScheduleCallFormProps) {
  const t = useTranslations("investor.room");
  const [scheduledAt, setScheduledAt] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await requestScheduledCallAction({
        dealId,
        scheduledAt: new Date(scheduledAt).toISOString(),
      });

      if (!result.ok) {
        setError(t("scheduleCallError"));
        return;
      }

      setScheduledAt("");
      setMessage(t("scheduleCallSuccess"));
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-2xl border border-border/70 bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-primary" />
        <h3 className="font-medium">{t("scheduleCallTitle")}</h3>
      </div>
      <p className="text-xs text-muted-foreground">{t("scheduleCallHint")}</p>
      <div className="space-y-2">
        <Label htmlFor="call-datetime">{t("scheduleCallLabel")}</Label>
        <Input
          id="call-datetime"
          type="datetime-local"
          required
          disabled={pending}
          value={scheduledAt}
          onChange={(e) => setScheduledAt(e.target.value)}
        />
      </div>
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {t("scheduleCallCta")}
      </Button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </form>
  );
}
