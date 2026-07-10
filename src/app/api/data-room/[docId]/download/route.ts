import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { assertDealParticipant, assertFirmDealAccess } from "@/lib/data-room/access";
import { downloadDataRoomFile, getDataRoomDocument } from "@/lib/data-room/upload";
import { buildWatermarkedTextContent } from "@/lib/data-room/watermark";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
import { writeAuditLog } from "@/lib/audit";
import { enforceRateLimit, RATE_LIMITS, rateLimitResponseBody } from "@/lib/rate-limit";

const docIdSchema = z.string().uuid();

export async function GET(
  request: Request,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId: rawDocId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsedDocId = docIdSchema.safeParse(rawDocId);
  if (!parsedDocId.success) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const docId = parsedDocId.data;

  const doc = await getDataRoomDocument(docId);
  if (!doc) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const membership = await getFirmMembershipForUser(userId);
    if (membership) {
      await assertFirmDealAccess(doc.dealId);
    } else {
      await assertDealParticipant(doc.dealId, userId);
    }
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const rate = await enforceRateLimit({
    subjectSub: userId,
    actionKey: "data_room.download",
    rules: RATE_LIMITS.dataRoomDownload,
    tenantId: doc.tenantId,
  });
  if (!rate.allowed) {
    return NextResponse.json(rateLimitResponseBody(rate), { status: 429 });
  }

  try {
    const { buffer, mimeType, fileName, fingerprint } = await downloadDataRoomFile(docId);
    const accessedAt = new Date();
    const viewerName = userId;

    let body: Buffer | string = buffer;
    let contentType = mimeType;

    if (mimeType.startsWith("text/") || mimeType === "application/json") {
      const text = buffer.toString("utf8");
      body = buildWatermarkedTextContent(text, viewerName, accessedAt);
      contentType = "text/plain; charset=utf-8";
    }

    await writeAuditLog({
      action: "data_room.download",
      actorSub: userId,
      tenantId: doc.tenantId,
      resourceType: "data_room_document",
      resourceId: docId,
      metadata: { fingerprint, fileName },
      request,
    });

    const headers = new Headers({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${fileName}"`,
    });
    if (fingerprint) headers.set("X-Abada-Fingerprint", fingerprint);

    return new NextResponse(
      typeof body === "string" ? body : new Uint8Array(body),
      { status: 200, headers },
    );
  } catch (error) {
    console.error("[data-room/download]", error);
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
