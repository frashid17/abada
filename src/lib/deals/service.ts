import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { DATA_ROOM_BUCKET } from "@/lib/data-room/upload";
import type {
  CreateDealInput,
  DealParticipantRecord,
  DealRecord,
} from "@/lib/deals/types";

function mapDeal(row: {
  id: string;
  tenant_id: string;
  name: string;
  status: string;
  created_at: string;
}): DealRecord {
  return {
    id: row.id,
    tenantId: row.tenant_id,
    name: row.name,
    status: row.status,
    createdAt: row.created_at,
  };
}

export async function createDeal(input: CreateDealInput): Promise<DealRecord> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id")
    .eq("id", input.tenantId)
    .maybeSingle();

  if (tenantError) throw tenantError;
  if (!tenant) {
    throw new Error("tenant_not_configured");
  }

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      tenant_id: input.tenantId,
      name: input.name,
      status: "active",
    })
    .select("id, tenant_id, name, status, created_at")
    .single();

  if (error) throw error;

  const participants: Array<{ deal_id: string; participant_sub: string; role: string }> = [
    { deal_id: deal.id, participant_sub: input.targetSub, role: "target" },
  ];

  for (const investorSub of input.investorSubs ?? []) {
    participants.push({
      deal_id: deal.id,
      participant_sub: investorSub,
      role: "investor",
    });
  }

  const { error: participantError } = await supabase.from("deal_participants").insert(participants);
  if (participantError) throw participantError;

  return mapDeal(deal);
}

export async function listDealsForParticipant(
  participantSub: string,
  role?: DealParticipantRecord["role"],
): Promise<DealRecord[]> {
  const supabase = createServiceRoleSupabaseClient();

  let membershipQuery = supabase
    .from("deal_participants")
    .select("deal_id")
    .eq("participant_sub", participantSub);

  if (role) {
    membershipQuery = membershipQuery.eq("role", role);
  }

  const { data: memberships, error: membershipError } = await membershipQuery;

  if (membershipError) throw membershipError;
  if (!memberships?.length) return [];

  const dealIds = memberships.map((row) => row.deal_id);

  const { data: deals, error } = await supabase
    .from("deals")
    .select("id, tenant_id, name, status, created_at")
    .in("id", dealIds)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (deals ?? []).map(mapDeal);
}

export async function listDealParticipants(dealId: string): Promise<DealParticipantRecord[]> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("deal_participants")
    .select("id, deal_id, participant_sub, role")
    .eq("deal_id", dealId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: row.id,
    dealId: row.deal_id,
    participantSub: row.participant_sub,
    role: row.role as DealParticipantRecord["role"],
  }));
}

export async function deleteDeal(dealId: string): Promise<void> {
  const supabase = createServiceRoleSupabaseClient();

  const { data: documents, error: documentsError } = await supabase
    .from("data_room_documents")
    .select("storage_path")
    .eq("deal_id", dealId);

  if (documentsError) throw documentsError;

  const storagePaths = (documents ?? []).map((document) => document.storage_path);
  if (storagePaths.length > 0) {
    const { error: storageError } = await supabase.storage
      .from(DATA_ROOM_BUCKET)
      .remove(storagePaths);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from("deals").delete().eq("id", dealId);
  if (error) throw error;
}
