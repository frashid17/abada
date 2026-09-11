import type { UsageAnalyticsSummary } from "@/lib/platform-admin/usage-analytics";
import { getTranslations } from "next-intl/server";

function StatCard({ label, value, hint }: { label: string; value: number | string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-border/70 bg-muted/20 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 font-serif text-3xl font-semibold tabular-nums text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export async function UsageAnalyticsDashboard({ summary }: { summary: UsageAnalyticsSummary }) {
  const t = await getTranslations("admin.analytics");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.users")} value={summary.usersTotal} hint={t("stats.usersHint", { count: summary.usersOnboarded })} />
        <StatCard label={t("stats.documents")} value={summary.documentsTotal} />
        <StatCard label={t("stats.reviews")} value={summary.reviewsTotal} hint={t("stats.reviewsHint", { count: summary.openReviews })} />
        <StatCard label={t("stats.aiCalls")} value={summary.aiCallsTotal} hint={t("stats.aiHint", { count: summary.aiCallsLast7Days })} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label={t("stats.ai30")} value={summary.aiCallsLast30Days} />
        <StatCard label={t("stats.audit7")} value={summary.auditEventsLast7Days} />
        <StatCard label={t("stats.product7")} value={summary.productEventsLast7Days} />
        <StatCard
          label={t("stats.invites")}
          value={summary.invitesPending}
          hint={t("stats.invitesHint", { count: summary.invitesAccepted })}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border/70 p-5">
          <h3 className="font-serif text-lg font-semibold">{t("byTaskTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("byTaskSubtitle")}</p>
          {summary.aiByTask.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("emptyTasks")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {summary.aiByTask.map((row) => (
                <li
                  key={row.task}
                  className="flex items-center justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0"
                >
                  <span className="font-mono text-xs">{row.task}</span>
                  <span className="tabular-nums text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-border/70 p-5">
          <h3 className="font-serif text-lg font-semibold">{t("dailyTitle")}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{t("dailySubtitle")}</p>
          {summary.dailyAiCalls.length === 0 ? (
            <p className="mt-4 text-sm text-muted-foreground">{t("emptyDaily")}</p>
          ) : (
            <ul className="mt-4 space-y-2">
              {summary.dailyAiCalls.slice(-14).map((row) => (
                <li
                  key={row.day}
                  className="flex items-center justify-between gap-3 border-b border-border/40 py-2 text-sm last:border-0"
                >
                  <span className="tabular-nums">{row.day}</span>
                  <span className="tabular-nums text-muted-foreground">{row.count}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-border/70 p-5">
        <h3 className="font-serif text-lg font-semibold">{t("eventsTitle")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t("eventsSubtitle")}</p>
        {summary.recentProductEvents.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">{t("emptyEvents")}</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead className="border-b border-border/60 text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4 font-medium">{t("colWhen")}</th>
                  <th className="py-2 pr-4 font-medium">{t("colEvent")}</th>
                  <th className="py-2 font-medium">{t("colActor")}</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentProductEvents.map((row) => (
                  <tr key={row.id} className="border-b border-border/40 last:border-0">
                    <td className="py-2 pr-4 tabular-nums text-muted-foreground">
                      {new Date(row.createdAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4 font-mono text-xs">{row.event}</td>
                    <td className="py-2 font-mono text-xs text-muted-foreground">
                      {row.actorSub ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
