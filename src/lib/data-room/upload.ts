import { assertDealParticipant } from "@/lib/data-room/access";
import { createFileFingerprint } from "@/lib/data-room/fingerprint";
import { buildDataRoomStoragePath } from "@/lib/data-room/storage";
import { scanUploadBuffer } from "@/lib/data-room/virus-scan";
import { buildWatermarkPolicy } from "@/lib/data-room/watermark";
import { isDdDocumentCategory } from "@/lib/dd/taxonomy";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import type { DataRoomDocumentRecord } from "@/lib/deals/types";

export const DATA_ROOM_BUCKET = "data-rooms";

export type UploadDataRoomFileInput = {
  dealId: string;
  uploaderSub: string;
  uploaderName: string;
  taxonomyCategory: string;
  title: string;
  fileName: string;
  mimeType: string;
  fileBytes: Buffer;
  ndaGateRequired?: boolean;
};

function mapRow(row: {
  id: string;
  deal_id: string;
  tenant_id: string;
  taxonomy_category: string;
  title: string;
  storage_path: string;
  version_number: number;
  fingerprint: string | null;
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
    fingerprint: row.fingerprint,
    ndaGateRequired: row.nda_gate_required,
  };
}

export async function getNextDocumentVersion(
  dealId: string,
  taxonomyCategory: string,
): Promise<number> {
  const supabase = createServiceRoleSupabaseClient();
  const { data } = await supabase
    .from("data_room_documents")
    .select("version_number")
    .eq("deal_id", dealId)
    .eq("taxonomy_category", taxonomyCategory)
    .order("version_number", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.version_number ?? 0) + 1;
}

export async function uploadDataRoomFile(
  input: UploadDataRoomFileInput,
): Promise<DataRoomDocumentRecord> {
  if (!isDdDocumentCategory(input.taxonomyCategory)) {
    throw new Error("Invalid taxonomy category");
  }

  const { tenantId } = await assertDealParticipant(input.dealId, input.uploaderSub, ["target"]);

  const scan = scanUploadBuffer(input.fileBytes, input.mimeType, input.fileName);
  if (!scan.passed) {
    throw new Error(scan.reason ?? "upload_rejected");
  }

  const versionNumber = await getNextDocumentVersion(input.dealId, input.taxonomyCategory);
  const storagePath = buildDataRoomStoragePath(
    input.dealId,
    input.taxonomyCategory,
    input.fileName,
    versionNumber,
  );

  const supabase = createServiceRoleSupabaseClient();
  const documentId = crypto.randomUUID();
  const fingerprint = createFileFingerprint({
    fileBytes: input.fileBytes,
    uploaderSub: input.uploaderSub,
    dealId: input.dealId,
    documentId,
    tenantId,
  });

  const { error: storageError } = await supabase.storage
    .from(DATA_ROOM_BUCKET)
    .upload(storagePath, input.fileBytes, {
      contentType: input.mimeType,
      upsert: false,
    });

  if (storageError) throw storageError;

  const accessedAt = new Date();
  const { data, error } = await supabase
    .from("data_room_documents")
    .insert({
      id: documentId,
      deal_id: input.dealId,
      tenant_id: tenantId,
      taxonomy_category: input.taxonomyCategory,
      title: input.title,
      storage_path: storagePath,
      version_number: versionNumber,
      fingerprint,
      watermark_policy: buildWatermarkPolicy(input.uploaderName, accessedAt),
      nda_gate_required: input.ndaGateRequired ?? false,
    })
    .select(
      "id, deal_id, tenant_id, taxonomy_category, title, storage_path, version_number, fingerprint, nda_gate_required",
    )
    .single();

  if (error) throw error;

  await supabase.from("audit_logs").insert({
    tenant_id: tenantId,
    actor_sub: input.uploaderSub,
    action: "data_room.upload",
    resource_type: "data_room_document",
    resource_id: data.id,
    metadata: {
      dealId: input.dealId,
      taxonomyCategory: input.taxonomyCategory,
      versionNumber,
      fingerprint,
      fileName: input.fileName,
      scanStatus: "passed",
    },
  });

  return mapRow(data);
}

export async function getDataRoomDocument(documentId: string): Promise<DataRoomDocumentRecord | null> {
  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase
    .from("data_room_documents")
    .select(
      "id, deal_id, tenant_id, taxonomy_category, title, storage_path, version_number, fingerprint, nda_gate_required",
    )
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return mapRow(data);
}

export async function downloadDataRoomFile(documentId: string): Promise<{
  buffer: Buffer;
  mimeType: string;
  fileName: string;
  fingerprint: string | null;
}> {
  const doc = await getDataRoomDocument(documentId);
  if (!doc) throw new Error("Document not found");

  const supabase = createServiceRoleSupabaseClient();
  const { data, error } = await supabase.storage.from(DATA_ROOM_BUCKET).download(doc.storagePath);

  if (error || !data) throw error ?? new Error("Download failed");

  const buffer = Buffer.from(await data.arrayBuffer());
  const fileName = doc.storagePath.split("/").pop() ?? "document";
  const mimeType = data.type || "application/octet-stream";

  return { buffer, mimeType, fileName, fingerprint: doc.fingerprint ?? null };
}
