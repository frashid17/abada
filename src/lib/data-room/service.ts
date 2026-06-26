import { buildDataRoomStoragePath } from "@/lib/data-room/storage";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { DataRoomDocumentInput, DataRoomDocumentRecord } from "@/lib/deals/types";

function mapDocument(row: {
  id: string;
  deal_id: string;
  tenant_id: string;
  taxonomy_category: string;
  title: string;
  storage_path: string;
  version_number: number;
  fingerprint?: string | null;
  nda_gate_required: boolean;
}): DataRoomDocumentRecord {
  return {
    id: row.id,
    dealId: row.deal_id,
    tenantId: row.tenant_id,
    taxonomyCategory: row.taxonomy_category,
    title: row.title,
    storagePath: row.storage_path,
    versionNumber: row.version_number,
    fingerprint: row.fingerprint ?? null,
    ndaGateRequired: row.nda_gate_required,
  };
}

export async function registerDataRoomDocument(
  input: DataRoomDocumentInput,
): Promise<DataRoomDocumentRecord> {
  const storagePath = buildDataRoomStoragePath(
    input.dealId,
    input.taxonomyCategory,
    input.fileName,
    input.versionNumber ?? 1,
  );

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("data_room_documents")
    .insert({
      deal_id: input.dealId,
      tenant_id: input.tenantId,
      taxonomy_category: input.taxonomyCategory,
      title: input.title,
      storage_path: storagePath,
      version_number: input.versionNumber ?? 1,
      nda_gate_required: input.ndaGateRequired ?? false,
    })
    .select(
      "id, deal_id, tenant_id, taxonomy_category, title, storage_path, version_number, fingerprint, nda_gate_required",
    )
    .single();

  if (error) throw error;
  return mapDocument(data);
}

export async function listDataRoomDocuments(dealId: string): Promise<DataRoomDocumentRecord[]> {
  const supabase = createServiceRoleSupabaseClient();

  const { data, error } = await supabase
    .from("data_room_documents")
    .select(
      "id, deal_id, tenant_id, taxonomy_category, title, storage_path, version_number, fingerprint, nda_gate_required",
    )
    .eq("deal_id", dealId)
    .order("taxonomy_category", { ascending: true })
    .order("version_number", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(mapDocument);
}
