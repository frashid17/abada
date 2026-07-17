"use server";

import { revalidatePath } from "next/cache";
import { MAX_UPLOAD_BYTES } from "@/lib/data-room/virus-scan";
import {
  isLegalSourceType,
  setCorpusFounderVisibility,
  upsertLegalSource,
} from "@/lib/platform-admin/service";
import type { LegalSourceType } from "@/lib/legal-corpus";

export async function toggleCorpusVisibilityAction(
  sourceId: string,
  founderVisible: boolean,
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await setCorpusFounderVisibility(sourceId, founderVisible);
    revalidatePath("/admin/corpus");
    revalidatePath("/admin");
    revalidatePath("/fundador/leyes");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to update visibility",
    };
  }
}

function mapExtractError(message: string): string {
  switch (message) {
    case "pdftotext_missing":
      return "PDF_TOOLS_MISSING";
    case "ocr_tools_missing":
      return "OCR_TOOLS_MISSING";
    case "invalid_pdf":
      return "INVALID_PDF";
    case "ocr_empty":
    case "ocr_no_pages":
    case "empty_extracted_text":
      return "EXTRACT_EMPTY";
    default:
      return message;
  }
}

export async function upsertLegalSourceAction(
  formData: FormData,
): Promise<
  | { ok: true; id: string; extractMethod?: string; chunkCount: number }
  | { ok: false; error: string }
> {
  try {
    const titleEs = String(formData.get("titleEs") ?? "").trim();
    const citationEs = String(formData.get("citationEs") ?? "").trim();
    if (!titleEs || !citationEs) {
      return { ok: false, error: "REQUIRED_FIELDS" };
    }

    const sourceType = String(formData.get("sourceType") ?? "");
    if (!isLegalSourceType(sourceType)) {
      return { ok: false, error: "INVALID_TYPE" };
    }

    const contentMode = String(formData.get("contentMode") ?? "paste");
    const pastedTextEs =
      contentMode === "paste" ? String(formData.get("pastedTextEs") ?? "") : undefined;

    let pdfBytes: Buffer | undefined;
    let pdfFileName: string | undefined;
    if (contentMode === "pdf") {
      const file = formData.get("pdfFile");
      if (!(file instanceof File) || file.size === 0) {
        return { ok: false, error: "PDF_REQUIRED" };
      }
      if (file.size > MAX_UPLOAD_BYTES) {
        return { ok: false, error: "PDF_TOO_LARGE" };
      }
      const mime = file.type || "application/pdf";
      if (mime !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
        return { ok: false, error: "INVALID_PDF" };
      }
      pdfBytes = Buffer.from(await file.arrayBuffer());
      pdfFileName = file.name;
    }

    const result = await upsertLegalSource({
      id: String(formData.get("id") ?? "").trim() || undefined,
      sourceType: sourceType as LegalSourceType,
      citationEs,
      citationEn: String(formData.get("citationEn") ?? ""),
      titleEs,
      titleEn: String(formData.get("titleEn") ?? ""),
      descriptionEs: String(formData.get("descriptionEs") ?? ""),
      descriptionEn: String(formData.get("descriptionEn") ?? ""),
      founderVisible: formData.get("founderVisible") === "true",
      pastedTextEs,
      pdfBytes,
      pdfFileName,
    });

    revalidatePath("/admin/corpus");
    revalidatePath("/admin");
    revalidatePath("/fundador/leyes");
    revalidatePath(`/fundador/leyes/${result.id}`);
    return {
      ok: true,
      id: result.id,
      extractMethod: result.extractMethod,
      chunkCount: result.chunkCount,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save legal source";
    return { ok: false, error: mapExtractError(message) };
  }
}
