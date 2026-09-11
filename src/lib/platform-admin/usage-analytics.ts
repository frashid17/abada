import { requirePlatformAdmin } from "@/lib/platform-admin/auth";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type UsageAnalyticsSummary = {
  usersTotal: number;
  usersOnboarded: number;
  documentsTotal: number;
  reviewsTotal: number;
  openReviews: number;
  aiCallsTotal: number;
  aiCallsLast7Days: number;
  aiCallsLast30Days: number;
  auditEventsLast7Days: number;
  productEventsLast7Days: number;
  invitesPending: number;
  invitesAccepted: number;
  aiByTask: Array<{ task: string; count: number }>;
  dailyAiCalls: Array<{ day: string; count: number }>;
  recentProductEvents: Array<{
    id: string;
    event: string;
    actorSub: string | null;
    createdAt: string;
  }>;
};

function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function bucketByDay(timestamps: string[]): Array<{ day: string; count: number }> {
  const map = new Map<string, number>();
  for (const ts of timestamps) {
    const day = ts.slice(0, 10);
    map.set(day, (map.get(day) ?? 0) + 1);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }));
}

export async function getUsageAnalyticsSummary(): Promise<UsageAnalyticsSummary> {
  await requirePlatformAdmin();
  const supabase = createServiceRoleSupabaseClient();
  const since7 = daysAgoIso(7);
  const since30 = daysAgoIso(30);

  const [
    usersTotal,
    usersOnboarded,
    documentsTotal,
    reviewsTotal,
    openReviews,
    aiCallsTotal,
    aiLast7,
    aiLast30,
    auditLast7,
    productLast7,
    invitesPending,
    invitesAccepted,
    aiRows,
    productRows,
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("onboarding_complete", true),
    supabase.from("documents").select("id", { count: "exact", head: true }),
    supabase.from("reviews").select("id", { count: "exact", head: true }),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .in("status", ["queued", "in_progress"]),
    supabase.from("ai_call_logs").select("id", { count: "exact", head: true }),
    supabase
      .from("ai_call_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    supabase
      .from("ai_call_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since30),
    supabase
      .from("audit_logs")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    supabase
      .from("analytics_events")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since7),
    supabase
      .from("platform_invitations")
      .select("id", { count: "exact", head: true })
      .is("accepted_at", null)
      .gt("expires_at", new Date().toISOString()),
    supabase
      .from("platform_invitations")
      .select("id", { count: "exact", head: true })
      .not("accepted_at", "is", null),
    supabase
      .from("ai_call_logs")
      .select("task, created_at")
      .gte("created_at", since30)
      .order("created_at", { ascending: false })
      .limit(2000),
    supabase
      .from("analytics_events")
      .select("id, event, actor_sub, created_at")
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const taskCounts = new Map<string, number>();
  for (const row of aiRows.data ?? []) {
    const task = row.task || "unknown";
    taskCounts.set(task, (taskCounts.get(task) ?? 0) + 1);
  }

  return {
    usersTotal: usersTotal.count ?? 0,
    usersOnboarded: usersOnboarded.count ?? 0,
    documentsTotal: documentsTotal.count ?? 0,
    reviewsTotal: reviewsTotal.count ?? 0,
    openReviews: openReviews.count ?? 0,
    aiCallsTotal: aiCallsTotal.count ?? 0,
    aiCallsLast7Days: aiLast7.count ?? 0,
    aiCallsLast30Days: aiLast30.count ?? 0,
    auditEventsLast7Days: auditLast7.count ?? 0,
    productEventsLast7Days: productLast7.count ?? 0,
    invitesPending: invitesPending.count ?? 0,
    invitesAccepted: invitesAccepted.count ?? 0,
    aiByTask: [...taskCounts.entries()]
      .map(([task, count]) => ({ task, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12),
    dailyAiCalls: bucketByDay((aiRows.data ?? []).map((r) => r.created_at)),
    recentProductEvents: (productRows.data ?? []).map((row) => ({
      id: row.id,
      event: row.event,
      actorSub: row.actor_sub,
      createdAt: row.created_at,
    })),
  };
}
