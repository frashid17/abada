import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { Json } from "@/types/database";

export type AuditLogInput = {
  action: string;
  actorSub: string;
  resourceType: string;
  tenantId?: string | null;
  resourceId?: string;
  metadata?: Record<string, unknown>;
  /** Pass the incoming Request to capture IP and user agent. */
  request?: Request;
};

export function clientIpFromRequest(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return request.headers.get("x-real-ip");
}

/**
 * Centralized audit trail: who, what, when, from where, tenant.
 * Best-effort — an audit failure must never break the user action, but it is
 * logged loudly so gaps are visible.
 */
export async function writeAuditLog(input: AuditLogInput): Promise<void> {
  try {
    const supabase = createServiceRoleSupabaseClient();

    const metadata: Record<string, unknown> = { ...(input.metadata ?? {}) };
    const userAgent = input.request?.headers.get("user-agent");
    if (userAgent) metadata.userAgent = userAgent;

    const { error } = await supabase.from("audit_logs").insert({
      tenant_id: input.tenantId ?? null,
      actor_sub: input.actorSub,
      action: input.action,
      resource_type: input.resourceType,
      resource_id: input.resourceId ?? null,
      ip_address: input.request ? clientIpFromRequest(input.request) : null,
      metadata: metadata as Json,
    });

    if (error) throw error;
  } catch (error) {
    console.error(`[audit] failed to record ${input.action}`, error);
  }
}
