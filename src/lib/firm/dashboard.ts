import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { getPrimaryFirmTenantId, repairReviewTenantRouting } from "@/lib/firm/tenant";
import type { ReviewStatus } from "@/lib/firm/reviews";

export type FirmDashboardReview = {
  id: string;
  documentTitle: string;
  status: ReviewStatus;
  createdAt: string;
};

export type FirmDashboardData = {
  tenantName: string;
  role: FirmMemberRole;
  isAdmin: boolean;
  stats: {
    pendingReviews: number;
    completedReviews: number;
    activeDeals: number;
    teamMembers: number;
    pendingInvites: number;
  };
  recentReviews: FirmDashboardReview[];
};

export async function getFirmDashboardData(input: {
  tenantId: string;
  tenantName: string;
  role: FirmMemberRole;
}): Promise<FirmDashboardData> {
  const supabase = createServiceRoleSupabaseClient();
  const isAdmin = input.role === "admin" || input.role === "partner";
  const reviewTenantId = (await getPrimaryFirmTenantId()) ?? input.tenantId;
  await repairReviewTenantRouting(reviewTenantId);

  const [reviewsResult, pendingCountResult, completedCountResult, dealsResult, membersResult, invitesResult] =
    await Promise.all([
      supabase
        .from("reviews")
        .select(
          `
        id,
        status,
        created_at,
        documents ( title, document_type )
      `,
        )
        .eq("tenant_id", reviewTenantId)
        .in("status", ["queued", "in_progress"])
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", reviewTenantId)
        .in("status", ["queued", "in_progress"]),
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", reviewTenantId)
        .eq("status", "completed"),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId)
        .eq("status", "active"),
      supabase
        .from("memberships")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", input.tenantId),
      isAdmin
        ? supabase
            .from("firm_invitations")
            .select("id", { count: "exact", head: true })
            .eq("tenant_id", input.tenantId)
            .is("accepted_at", null)
            .gt("expires_at", new Date().toISOString())
        : Promise.resolve({ count: 0, error: null }),
    ]);

  if (reviewsResult.error) throw reviewsResult.error;
  if (pendingCountResult.error) throw pendingCountResult.error;
  if (completedCountResult.error) throw completedCountResult.error;
  if (dealsResult.error) throw dealsResult.error;
  if (membersResult.error) throw membersResult.error;
  if (invitesResult.error) throw invitesResult.error;

  const pendingReviews = reviewsResult.data ?? [];

  const recentReviews: FirmDashboardReview[] = pendingReviews.map((row) => {
    const doc = row.documents as { title: string | null; document_type: string } | null;
    return {
      id: row.id,
      documentTitle: doc?.title ?? doc?.document_type ?? "document",
      status: row.status as ReviewStatus,
      createdAt: row.created_at,
    };
  });

  return {
    tenantName: input.tenantName,
    role: input.role,
    isAdmin,
    stats: {
      pendingReviews: pendingCountResult.count ?? 0,
      completedReviews: completedCountResult.count ?? 0,
      activeDeals: dealsResult.count ?? 0,
      teamMembers: membersResult.count ?? 0,
      pendingInvites: invitesResult.count ?? 0,
    },
    recentReviews,
  };
}
