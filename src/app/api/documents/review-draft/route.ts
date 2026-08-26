import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { getBrandName, getFirmName } from "@/lib/brand";
import { buildReviewDraftPdf } from "@/lib/documents/prototype/review-pdf";
import type { PrototypeCompany } from "@/lib/documents/prototype/store";
import { writeAuditLog } from "@/lib/audit";

type ReviewDraftBody = {
  locale?: string;
  company?: PrototypeCompany;
  decisions?: Record<string, string | number>;
};

function sanitizeFilename(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48)
    .toLowerCase();
}

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ReviewDraftBody;
  try {
    body = (await request.json()) as ReviewDraftBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const locale = body.locale === "en-US" ? "en-US" : "es-CO";
  const company = body.company;
  const decisions = body.decisions ?? {};

  if (!company || typeof company !== "object") {
    return NextResponse.json({ error: "Missing company" }, { status: 400 });
  }

  try {
    const pdf = await buildReviewDraftPdf({
      locale,
      brandName: getBrandName(),
      firmName: getFirmName(),
      company,
      decisions,
    });

    const slug = sanitizeFilename(company.nombre || "revision");
    const filename = `abada-revision-decisiones-${slug || "borrador"}.pdf`;

    await writeAuditLog({
      action: "document.review_draft_download",
      actorSub: userId,
      resourceType: "document",
      resourceId: "prototype_review",
      metadata: { locale, openDecisions: Object.keys(decisions).length },
      request,
    });

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "PDF generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
