import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { isInvestmentDocumentType } from "@/lib/documents/catalog";
import { isFlowDocumentType } from "@/lib/documents/intake";
import { createFingerprintedVersion } from "@/lib/documents/service";

type RouteContext = {
  params: Promise<{ docType: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { docType } = await context.params;
  if (!isInvestmentDocumentType(docType) || !isFlowDocumentType(docType)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const localeParam = new URL(request.url).searchParams.get("locale");
  const locale = localeParam === "en-US" ? "en-US" : "es-CO";
  const sessionId = request.headers.get("x-session-id") ?? undefined;

  try {
    const { fingerprint, version, pdf } = await createFingerprintedVersion(
      docType,
      sessionId,
      locale,
    );
    const filename = `abada-${docType}-v${version}.pdf`;

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Abada-Fingerprint": fingerprint,
        "X-Abada-Version": String(version),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Download failed";
    const status = message.includes("Missing required") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
