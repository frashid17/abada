import { auth } from "@clerk/nextjs/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  INVESTMENT_DOCUMENT_CATALOG,
  type DocumentStatus,
  type InvestmentDocumentType,
} from "@/lib/documents/catalog";

export type DashboardDocument = {
  id: string;
  documentType: InvestmentDocumentType;
  title: string;
  status: DocumentStatus;
  step: number;
  updatedAt: string;
};

export type FounderDashboardData = {
  documents: DashboardDocument[];
  completedCount: number;
  totalCount: number;
};

async function getOwnerSub(): Promise<string> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

/** Ensures all five checklist rows exist for the founder (idempotent). */
export async function ensureInvestmentReadinessChecklist(): Promise<void> {
  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const { data: existing, error } = await supabase
    .from("documents")
    .select("document_type")
    .eq("owner_sub", ownerSub);

  if (error) throw error;

  const existingTypes = new Set((existing ?? []).map((row) => row.document_type));
  const missing = INVESTMENT_DOCUMENT_CATALOG.filter((def) => !existingTypes.has(def.type));

  if (missing.length === 0) return;

  const { error: insertError } = await supabase.from("documents").insert(
    missing.map((def) => ({
      owner_sub: ownerSub,
      document_type: def.type,
      title: def.type,
      status: "not_started" as const,
    })),
  );

  if (insertError) throw insertError;
}

export async function getFounderDashboard(): Promise<FounderDashboardData> {
  await ensureInvestmentReadinessChecklist();
  const ownerSub = await getOwnerSub();
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("documents")
    .select("id, document_type, title, status, updated_at")
    .eq("owner_sub", ownerSub)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const byType = new Map(
    (data ?? []).map((row) => [
      row.document_type,
      {
        id: row.id,
        documentType: row.document_type as InvestmentDocumentType,
        title: row.title,
        status: row.status as DocumentStatus,
        updatedAt: row.updated_at,
      },
    ]),
  );

  const documents: DashboardDocument[] = INVESTMENT_DOCUMENT_CATALOG.map((def) => {
    const row = byType.get(def.type);
    return {
      id: row?.id ?? def.type,
      documentType: def.type,
      title: row?.title ?? def.type,
      status: row?.status ?? "not_started",
      step: def.step,
      updatedAt: row?.updatedAt ?? new Date(0).toISOString(),
    };
  });

  const completedCount = documents.filter((d) => d.status === "complete").length;

  return {
    documents,
    completedCount,
    totalCount: documents.length,
  };
}
