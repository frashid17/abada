import { getTranslations } from "next-intl/server";
import type { DealParticipantRecord } from "@/lib/deals/types";

type DealParticipantsPanelProps = {
  participants: Array<DealParticipantRecord & { label: string }>;
};

export async function DealParticipantsPanel({ participants }: DealParticipantsPanelProps) {
  const t = await getTranslations("firm.dd");

  const grouped = {
    target: participants.filter((participant) => participant.role === "target"),
    investor: participants.filter((participant) => participant.role === "investor"),
  };

  return (
    <section className="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
      <h3 className="font-serif text-lg font-semibold">{t("participantsTitle")}</h3>
      <div className="space-y-3 text-sm">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("participantTarget")}
          </p>
          <ul className="mt-1 space-y-1">
            {grouped.target.map((participant) => (
              <li key={participant.id}>{participant.label}</li>
            ))}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("participantInvestors")}
          </p>
          {grouped.investor.length === 0 ? (
            <p className="mt-1 text-muted-foreground">{t("noInvestorsYet")}</p>
          ) : (
            <ul className="mt-1 space-y-1">
              {grouped.investor.map((participant) => (
                <li key={participant.id}>{participant.label}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
