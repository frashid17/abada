import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { parseDocumentLocale } from "@/lib/documents/document-locale";
import { isLegalSourceId } from "@/lib/legal-corpus/routes";
import { getLegalSourceDetail, filterLegalChunks } from "@/lib/legal-corpus/service";

const querySchema = z.object({
  locale: z.enum(["es-CO", "en-US"]).optional(),
  q: z.string().max(200).optional(),
  offset: z.coerce.number().int().min(0).default(0),
  limit: z.coerce.number().int().min(1).max(200).default(80),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sourceId: string }> },
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sourceId } = await params;
  if (!isLegalSourceId(sourceId)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const url = new URL(request.url);
  const parsed = querySchema.safeParse({
    locale: url.searchParams.get("locale") ?? undefined,
    q: url.searchParams.get("q") ?? undefined,
    offset: url.searchParams.get("offset") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const locale = parseDocumentLocale(parsed.data.locale);
  const detail = await getLegalSourceDetail(sourceId, locale);
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filtered = parsed.data.q
    ? filterLegalChunks(detail.chunks, parsed.data.q)
    : detail.chunks;

  const slice = filtered.slice(parsed.data.offset, parsed.data.offset + parsed.data.limit);

  return NextResponse.json({
    sourceId: detail.id,
    title: detail.title,
    citation: detail.citation,
    locale: detail.locale,
    officialLocale: detail.officialLocale,
    chunkCount: filtered.length,
    totalChunks: detail.chunkCount,
    offset: parsed.data.offset,
    limit: parsed.data.limit,
    hasMore: parsed.data.offset + parsed.data.limit < filtered.length,
    chunks: slice.map((chunk) => ({
      chunkIndex: chunk.chunkIndex,
      articleRef: chunk.articleRef,
      heading: chunk.heading,
      content: chunk.content,
      translationStatus: chunk.translationStatus,
    })),
  });
}
