import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";

export type ScheduledCallStatus = "scheduled" | "completed" | "cancelled";

export type ScheduledCallRecord = {
  id: string;
  tenantId: string;
  requesterSub: string;
  paymentId: string | null;
  scheduledAt: string;
  status: ScheduledCallStatus;
  createdAt: string;
};

function mapCall(row: {
  id: string;
  tenant_id: string;
  requester_sub: string;
  payment_id: string | null;
  scheduled_at: string;
  status: string;
  created_at: string;
}): ScheduledCallRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    requesterSub: row.requester_sub,
    paymentId: row.payment_id,
    scheduledAt: row.scheduled_at,
    status: row.status as ScheduledCallStatus,
    createdAt: row.created_at,
  };
}

export async function requestScheduledCall(input: {
  tenantId: string;
  requesterSub: string;
  scheduledAt: string;
}): Promise<ScheduledCallRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_calls")
    .insert({
      tenant_id: input.tenantId,
      requester_sub: input.requesterSub,
      scheduled_at: input.scheduledAt,
      status: "scheduled",
    })
    .select("id, tenant_id, requester_sub, payment_id, scheduled_at, status, created_at")
    .single();

  if (error) throw error;
  return mapCall(data);
}

export async function listScheduledCallsForRequester(
  requesterSub: string,
): Promise<ScheduledCallRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_calls")
    .select("id, tenant_id, requester_sub, payment_id, scheduled_at, status, created_at")
    .eq("requester_sub", requesterSub)
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCall);
}

export async function listScheduledCallsForTenant(tenantId: string): Promise<ScheduledCallRecord[]> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_calls")
    .select("id, tenant_id, requester_sub, payment_id, scheduled_at, status, created_at")
    .eq("tenant_id", tenantId)
    .order("scheduled_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map(mapCall);
}

export async function updateScheduledCallStatus(input: {
  callId: string;
  tenantId: string;
  status: ScheduledCallStatus;
}): Promise<ScheduledCallRecord> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("scheduled_calls")
    .update({ status: input.status })
    .eq("id", input.callId)
    .eq("tenant_id", input.tenantId)
    .select("id, tenant_id, requester_sub, payment_id, scheduled_at, status, created_at")
    .single();

  if (error) throw error;
  return mapCall(data);
}
