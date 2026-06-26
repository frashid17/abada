import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, StandardFonts, degrees, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import { stripExecutionBlock, type DocumentLocale } from "@/lib/documents/document-locale";
import type { PartySignature } from "@/lib/documents/signatures";
import { getAttestationCopy } from "@/lib/documents/signatures";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 54;
const FONT_SIZE = 12;
const LINE_HEIGHT = 15;
const FOOTER_HEIGHT = 32;

const BLACK = rgb(0, 0, 0);
const ORANGE = rgb(0.89, 0.45, 0.32);
const GREEN = rgb(0.16, 0.62, 0.42);
const SIGNATURE_BLUE = rgb(0.12, 0.28, 0.58);

export type DocumentPdfInput = {
  title: string;
  body: string;
  fingerprint: string;
  version: number;
  disclaimer: string;
  locale: DocumentLocale;
  firmName: string;
  partySignatures: PartySignature[];
  attorneySignature?: {
    name: string;
    signedAt: string;
  };
};

type BlockType = "title" | "section" | "paragraph";

type DocumentBlock = {
  type: BlockType;
  text: string;
};

type PdfContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  pageIndex: number;
  y: number;
  contentTop: number;
  contentBottom: number;
  regular: PDFFont;
  bold: PDFFont;
  cursive: PDFFont;
  maxWidth: number;
  input: DocumentPdfInput;
  reviewed: boolean;
};

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text.trim()) return [];

  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function parseDocumentBody(body: string): DocumentBlock[] {
  const blocks: DocumentBlock[] = [];
  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);

  for (const paragraph of paragraphs) {
    const line = paragraph.replace(/\s+/g, " ").trim();
    if (!line) continue;

    if (blocks.length === 0 && line.length < 140) {
      blocks.push({ type: "title", text: line });
      continue;
    }

    if (/^\d+(\.\d+)?\.\s+/.test(line) && line.length < 160) {
      blocks.push({ type: "section", text: line });
      continue;
    }

    blocks.push({ type: "paragraph", text: line });
  }

  return blocks;
}

function drawReviewWatermark(page: PDFPage, firmName: string, font: PDFFont) {
  const watermarkText = firmName;
  const positions = [
    { x: 30, y: 140 },
    { x: 200, y: 280 },
    { x: 30, y: 420 },
    { x: 200, y: 560 },
  ];

  for (const pos of positions) {
    page.drawText(watermarkText, {
      x: pos.x,
      y: pos.y,
      size: 36,
      font,
      color: ORANGE,
      opacity: 0.2,
      rotate: degrees(32),
    });
  }
}

function drawReviewedHeader(ctx: PdfContext) {
  const { page, input, bold, regular } = ctx;
  const copy = getAttestationCopy(input.locale);
  const signedDate = input.attorneySignature
    ? new Date(input.attorneySignature.signedAt).toLocaleDateString(
        input.locale === "en-US" ? "en-US" : "es-CO",
        { dateStyle: "long" },
      )
    : "";

  let y = PAGE_HEIGHT - MARGIN;

  page.drawText(input.firmName.toUpperCase(), {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: bold,
    color: ORANGE,
  });
  y -= 10;

  page.drawLine({
    start: { x: MARGIN, y },
    end: { x: PAGE_WIDTH - MARGIN, y },
    thickness: 1,
    color: ORANGE,
  });
  y -= 18;

  const meta =
    input.locale === "en-US"
      ? `Attorney reviewed · Review date: ${signedDate}`
      : `Revisado por abogado · Fecha de revisión: ${signedDate}`;

  page.drawText(meta, {
    x: MARGIN,
    y,
    size: 10,
    font: regular,
    color: BLACK,
  });

  const badge = input.locale === "en-US" ? "APPROVED" : "APROBADO";
  const badgeWidth = 72;
  page.drawRectangle({
    x: PAGE_WIDTH - MARGIN - badgeWidth,
    y: y - 4,
    width: badgeWidth,
    height: 18,
    color: GREEN,
  });
  page.drawText(badge, {
    x: PAGE_WIDTH - MARGIN - badgeWidth + 11,
    y: y,
    size: 9,
    font: bold,
    color: rgb(1, 1, 1),
  });

  ctx.contentTop = y - 28;
  ctx.y = ctx.contentTop;
}

function drawDraftHeader(ctx: PdfContext) {
  const { page, input, bold } = ctx;
  let y = PAGE_HEIGHT - MARGIN;

  page.drawText(input.firmName.toUpperCase(), {
    x: MARGIN,
    y,
    size: FONT_SIZE,
    font: bold,
    color: BLACK,
  });

  ctx.contentTop = y - 24;
  ctx.y = ctx.contentTop;
}

function drawPageFooter(ctx: PdfContext, pageIndex: number, totalPages: number) {
  const { page, input, regular, reviewed } = ctx;
  const copy = getAttestationCopy(input.locale);
  const footerY = 20;

  page.drawLine({
    start: { x: MARGIN, y: FOOTER_HEIGHT },
    end: { x: PAGE_WIDTH - MARGIN, y: FOOTER_HEIGHT },
    thickness: 0.5,
    color: rgb(0.75, 0.75, 0.75),
  });

  if (reviewed) {
    const footerText =
      input.locale === "en-US"
        ? `${input.firmName} · Confidential · ${input.firmName} — ${copy.watermarkReviewed}`
        : `${input.firmName} · Confidencial · ${input.firmName} — ${copy.watermarkReviewed}`;

    const footerWidth = regular.widthOfTextAtSize(footerText, 9);
    page.drawText(footerText, {
      x: (PAGE_WIDTH - footerWidth) / 2,
      y: footerY,
      size: 9,
      font: regular,
      color: BLACK,
    });
  } else {
    page.drawText(`${pageIndex + 1} / ${totalPages}`, {
      x: PAGE_WIDTH - MARGIN - 24,
      y: footerY,
      size: 9,
      font: regular,
      color: BLACK,
    });
  }
}

function initPage(ctx: PdfContext, isFirst: boolean) {
  if (!isFirst) {
    ctx.pageIndex += 1;
    ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  }

  if (ctx.reviewed) {
    drawReviewWatermark(ctx.page, ctx.input.firmName, ctx.bold);
  }

  if (isFirst) {
    if (ctx.reviewed) {
      drawReviewedHeader(ctx);
    } else {
      drawDraftHeader(ctx);
    }
  } else {
    ctx.y = PAGE_HEIGHT - MARGIN;
    ctx.contentTop = ctx.y;
  }
}

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.y - needed >= ctx.contentBottom) return;
  initPage(ctx, false);
}

function drawCenteredTitle(ctx: PdfContext, title: string) {
  const lines = wrapText(title, ctx.bold, FONT_SIZE, ctx.maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, LINE_HEIGHT + 2);
    const width = ctx.bold.widthOfTextAtSize(line, FONT_SIZE);
    ctx.page.drawText(line, {
      x: (PAGE_WIDTH - width) / 2,
      y: ctx.y,
      size: FONT_SIZE,
      font: ctx.bold,
      color: BLACK,
    });
    ctx.y -= LINE_HEIGHT + 2;
  }
  ctx.y -= 8;
}

function drawBlock(ctx: PdfContext, block: DocumentBlock) {
  if (block.type === "title") {
    return;
  }

  if (block.type === "section") {
    ctx.y -= 4;
    ensureSpace(ctx, LINE_HEIGHT);
    ctx.page.drawText(block.text, {
      x: MARGIN,
      y: ctx.y,
      size: FONT_SIZE,
      font: ctx.bold,
      color: BLACK,
    });
    ctx.y -= LINE_HEIGHT;
    return;
  }

  const lines = wrapText(block.text, ctx.regular, FONT_SIZE, ctx.maxWidth);
  for (const line of lines) {
    ensureSpace(ctx, LINE_HEIGHT);
    ctx.page.drawText(line, { x: MARGIN, y: ctx.y, size: FONT_SIZE, font: ctx.regular, color: BLACK });
    ctx.y -= LINE_HEIGHT;
  }
  ctx.y -= 6;
}

function drawPartySignatureColumn(
  ctx: PdfContext,
  party: PartySignature,
  x: number,
  width: number,
  topY: number,
) {
  const lineY = topY - 28;

  ctx.page.drawLine({
    start: { x, y: lineY },
    end: { x: x + width, y: lineY },
    thickness: 0.75,
    color: BLACK,
  });

  ctx.page.drawText(party.name, {
    x,
    y: lineY - 16,
    size: FONT_SIZE,
    font: ctx.bold,
    color: BLACK,
    maxWidth: width,
  });

  const role = party.subtitle ?? party.label;
  ctx.page.drawText(role, {
    x,
    y: lineY - 32,
    size: FONT_SIZE,
    font: ctx.regular,
    color: BLACK,
    maxWidth: width,
  });
}

function drawAttorneySignatureColumn(
  ctx: PdfContext,
  x: number,
  width: number,
  topY: number,
) {
  const copy = getAttestationCopy(ctx.input.locale);
  const attorney = ctx.input.attorneySignature;
  const lineY = topY - 28;
  const barX = x;

  ctx.page.drawRectangle({
    x: barX,
    y: lineY - 36,
    width: 3,
    height: 52,
    color: ORANGE,
  });

  const contentX = barX + 10;

  if (attorney) {
    const firstName = attorney.name.trim().split(/\s+/)[0] ?? attorney.name;
    const signedDate = new Date(attorney.signedAt).toLocaleDateString(
      ctx.input.locale === "en-US" ? "en-US" : "es-CO",
      { dateStyle: "long" },
    );

    ctx.page.drawText(firstName, {
      x: contentX,
      y: lineY + 10,
      size: 24,
      font: ctx.cursive,
      color: SIGNATURE_BLUE,
    });

    ctx.page.drawLine({
      start: { x: contentX, y: lineY },
      end: { x: x + width, y: lineY },
      thickness: 0.75,
      color: BLACK,
    });

    ctx.page.drawText(attorney.name, {
      x: contentX,
      y: lineY - 16,
      size: FONT_SIZE,
      font: ctx.bold,
      color: BLACK,
      maxWidth: width - 12,
    });

    const reviewedBy =
      ctx.input.locale === "en-US"
        ? `Reviewed by - ${ctx.input.firmName}`
        : `Revisado por - ${ctx.input.firmName}`;

    ctx.page.drawText(reviewedBy, {
      x: contentX,
      y: lineY - 32,
      size: FONT_SIZE,
      font: ctx.regular,
      color: BLACK,
      maxWidth: width - 12,
    });

    const dateLine =
      ctx.input.locale === "en-US"
        ? `Date of review: ${signedDate}`
        : `Fecha de revisión: ${signedDate}`;

    ctx.page.drawText(dateLine, {
      x: contentX,
      y: lineY - 48,
      size: FONT_SIZE,
      font: ctx.regular,
      color: BLACK,
      maxWidth: width - 12,
    });
  } else {
    ctx.page.drawLine({
      start: { x: contentX, y: lineY },
      end: { x: x + width, y: lineY },
      thickness: 0.75,
      color: BLACK,
    });

    ctx.page.drawText(copy.attorneyTitle, {
      x: contentX,
      y: lineY - 16,
      size: FONT_SIZE,
      font: ctx.regular,
      color: BLACK,
    });

    const pendingLines = wrapText(copy.pendingBody, ctx.regular, 10, width - 12);
    let py = lineY - 32;
    for (const line of pendingLines.slice(0, 3)) {
      ctx.page.drawText(line, { x: contentX, y: py, size: 10, font: ctx.regular, color: BLACK });
      py -= 12;
    }
  }
}

function drawSignaturesSection(ctx: PdfContext) {
  const copy = getAttestationCopy(ctx.input.locale);
  ctx.y -= 16;
  ensureSpace(ctx, 120);

  ctx.page.drawText(copy.signaturesHeading.toUpperCase(), {
    x: MARGIN,
    y: ctx.y,
    size: 10,
    font: ctx.bold,
    color: BLACK,
  });
  ctx.y -= 22;

  const topY = ctx.y;
  const gap = 12;
  const colWidth = (ctx.maxWidth - gap * 2) / 3;
  const parties = ctx.input.partySignatures.slice(0, 2);

  if (parties[0]) {
    drawPartySignatureColumn(ctx, parties[0], MARGIN, colWidth, topY);
  }
  if (parties[1]) {
    drawPartySignatureColumn(ctx, parties[1], MARGIN + colWidth + gap, colWidth, topY);
  }

  drawAttorneySignatureColumn(ctx, MARGIN + (colWidth + gap) * 2, colWidth, topY);

  ctx.y = topY - 88;
}

export async function buildDocumentPdf(input: DocumentPdfInput): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.registerFontkit(fontkit);

  const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  let cursive = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  try {
    const fontPath = path.join(process.cwd(), "src/lib/documents/fonts/DancingScript.ttf");
    const fontBytes = await readFile(fontPath);
    cursive = await pdfDoc.embedFont(fontBytes);
  } catch {
    // Fallback to Times italic.
  }

  const reviewed = Boolean(input.attorneySignature);
  const copy = getAttestationCopy(input.locale);
  const displayTitle = reviewed
    ? `${input.title} (${copy.watermarkReviewed})`
    : input.title;

  const cleanedBody = stripExecutionBlock(input.body, input.locale);
  const blocks = parseDocumentBody(cleanedBody);

  const ctx: PdfContext = {
    pdfDoc,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    pageIndex: 0,
    y: PAGE_HEIGHT - MARGIN,
    contentTop: PAGE_HEIGHT - MARGIN,
    contentBottom: MARGIN + FOOTER_HEIGHT,
    regular,
    bold,
    cursive,
    maxWidth: PAGE_WIDTH - MARGIN * 2,
    input,
    reviewed,
  };

  initPage(ctx, true);
  drawCenteredTitle(ctx, displayTitle);

  for (const block of blocks) {
    drawBlock(ctx, block);
  }

  drawSignaturesSection(ctx);

  const pages = pdfDoc.getPages();
  const totalPages = pages.length;
  pages.forEach((page, index) => {
    drawPageFooter({ ...ctx, page }, index, totalPages);
  });

  return pdfDoc.save();
}
