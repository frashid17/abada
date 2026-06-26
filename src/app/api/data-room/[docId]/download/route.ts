import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { assertDealParticipant, assertFirmDealAccess } from "@/lib/data-room/access";
import { downloadDataRoomFile, getDataRoomDocument } from "@/lib/data-room/upload";
import { buildWatermarkedTextContent } from "@/lib/data-room/watermark";
import { createServiceRoleSupabaseClient } from "@/lib/supabase/server";
import { getFirmMembershipForUser } from "@/lib/firm/membership";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ docId: string }> },
) {
  const { docId } = await params;
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

    await createServiceRoleSupabaseClient().from("audit_logs").insert({
      tenant_id: doc.tenantId,
      actor_sub: userId,
      action: "data_room.download",
      resource_type: "data_room_document",
      resource_id: docId,
      metadata: { fingerprint, fileName },
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
