import { PDFDocument, StandardFonts, rgb, type PDFPage, type PDFFont } from "pdf-lib";
import {
  PROTOTYPE_DECISIONS,
  PROTOTYPE_DOCS,
  listPrototypeDecisionRows,
} from "@/lib/documents/prototype/catalog";
import type { PrototypeCompany } from "@/lib/documents/prototype/store";
import esCO from "@/messages/es-CO.json";
import enUS from "@/messages/en-US.json";

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN_X = 50;
const MARGIN_TOP = 48;
const FOOTER_HEIGHT = 40;

const INK = rgb(22 / 255, 35 / 255, 58 / 255);
const INK_MUTED = rgb(90 / 255, 100 / 255, 120 / 255);
const ACCENT = rgb(166 / 255, 90 / 255, 22 / 255);
const LINE = rgb(210 / 255, 204 / 255, 194 / 255);
const RULE = rgb(22 / 255, 35 / 255, 58 / 255);

export type ReviewDraftPdfInput = {
  locale: "es-CO" | "en-US";
  brandName: string;
  firmName: string;
  company: PrototypeCompany;
  decisions: Record<string, string | number>;
};

type PdfCopy = (typeof esCO)["founder"]["documentsPrototype"]["pdf"];

type PreparedRow = {
  key: string;
  title: string;
  question: string;
  value: string;
  isDefault: boolean;
  docTitle: string;
  articleTitle: string;
};

type PdfContext = {
  pdfDoc: PDFDocument;
  page: PDFPage;
  pageIndex: number;
  y: number;
  contentBottom: number;
  regular: PDFFont;
  bold: PDFFont;
  italic: PDFFont;
  maxWidth: number;
  copy: PdfCopy;
  brandName: string;
  firmName: string;
};

const COL = {
  num: 28,
  decision: 220,
  value: 150,
  where: 0, // computed from maxWidth
} as const;

function getCopy(locale: "es-CO" | "en-US"): PdfCopy {
  return (locale === "en-US" ? enUS : esCO).founder.documentsPrototype.pdf;
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text.trim()) return [""];
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      // Hard-break very long tokens
      if (font.widthOfTextAtSize(word, size) > maxWidth) {
        let chunk = "";
        for (const ch of word) {
          const next = chunk + ch;
          if (font.widthOfTextAtSize(next, size) <= maxWidth) {
            chunk = next;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function prepareRows(input: ReviewDraftPdfInput): PreparedRow[] {
  const lang = input.locale === "en-US" ? "en" : "es";
  return listPrototypeDecisionRows().map((row) => {
    const decision = PROTOTYPE_DECISIONS[row.key];
    const raw = input.decisions[row.key];
    const isDefault = raw === undefined || raw === "";
    return {
      key: row.key,
      title: lang === "en" ? decision?.en ?? row.key : decision?.es ?? row.key,
      question: lang === "en" ? decision?.q_en ?? "" : decision?.q_es ?? "",
      value: decisionLabel(row.key, input.decisions, lang),
      isDefault,
      docTitle:
        lang === "en" ? PROTOTYPE_DOCS[row.docId].t_en : PROTOTYPE_DOCS[row.docId].t_es,
      articleTitle: lang === "en" ? row.article.t_en : row.article.t_es,
    };
  });
}

function decisionLabel(
  key: string,
  decisions: Record<string, string | number>,
  lang: "es" | "en",
): string {
  const decision = PROTOTYPE_DECISIONS[key];
  const value = decisions[key] ?? decision?.def;
  if (!decision || value === undefined || value === "") {
    return lang === "en" ? decision?.en ?? key : decision?.es ?? key;
  }
  if (decision.type === "num") return String(value);
  const option = decision.options?.find((item) => item.v === String(value));
  return option ? (lang === "en" ? option.te : option.t) : String(value);
}

function initPage(ctx: PdfContext, isFirst: boolean) {
  if (!isFirst) {
    ctx.pageIndex += 1;
    ctx.page = ctx.pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    ctx.y = PAGE_HEIGHT - MARGIN_TOP;
    drawContinuedHeader(ctx);
  }
}

function ensureSpace(ctx: PdfContext, needed: number) {
  if (ctx.y - needed >= ctx.contentBottom) return;
  initPage(ctx, false);
}

function drawRule(page: PDFPage, y: number, thickness = 0.6, color = LINE) {
  page.drawLine({
    start: { x: MARGIN_X, y },
    end: { x: PAGE_WIDTH - MARGIN_X, y },
    thickness,
    color,
  });
}

function drawContinuedHeader(ctx: PdfContext) {
  const label = `${ctx.brandName} · ${ctx.copy.title}`;
  ctx.page.drawText(label, {
    x: MARGIN_X,
    y: ctx.y,
    size: 8,
    font: ctx.regular,
    color: INK_MUTED,
  });
  ctx.y -= 8;
  drawRule(ctx.page, ctx.y, 0.5);
  ctx.y -= 16;
  drawTableHeader(ctx);
}

function columnWidths(maxWidth: number) {
  const where = maxWidth - COL.num - COL.decision - COL.value;
  return {
    num: COL.num,
    decision: COL.decision,
    value: COL.value,
    where: Math.max(where, 90),
  };
}

function drawTableHeader(ctx: PdfContext) {
  const cols = columnWidths(ctx.maxWidth);
  const y = ctx.y;

  ctx.page.drawText(ctx.copy.colNum, {
    x: MARGIN_X,
    y,
    size: 8,
    font: ctx.bold,
    color: INK_MUTED,
  });
  ctx.page.drawText(ctx.copy.colDecision, {
    x: MARGIN_X + cols.num,
    y,
    size: 8,
    font: ctx.bold,
    color: INK_MUTED,
  });
  ctx.page.drawText(ctx.copy.colValue, {
    x: MARGIN_X + cols.num + cols.decision,
    y,
    size: 8,
    font: ctx.bold,
    color: INK_MUTED,
  });
  ctx.page.drawText(ctx.copy.colWhere, {
    x: MARGIN_X + cols.num + cols.decision + cols.value,
    y,
    size: 8,
    font: ctx.bold,
    color: INK_MUTED,
  });

  ctx.y -= 6;
  drawRule(ctx.page, ctx.y, 0.9, RULE);
  ctx.y -= 12;
}

function drawHeader(ctx: PdfContext, input: ReviewDraftPdfInput, openCount: number) {
  const { page, bold, regular, italic, copy } = ctx;
  let y = PAGE_HEIGHT - MARGIN_TOP;

  page.drawText(ctx.brandName.toUpperCase(), {
    x: MARGIN_X,
    y,
    size: 10,
    font: bold,
    color: ACCENT,
  });

  const firm = ctx.firmName;
  const firmWidth = regular.widthOfTextAtSize(firm, 9);
  page.drawText(firm, {
    x: PAGE_WIDTH - MARGIN_X - firmWidth,
    y,
    size: 9,
    font: regular,
    color: INK_MUTED,
  });

  y -= 12;
  drawRule(page, y, 1.25, RULE);
  y -= 26;

  page.drawText(copy.title, {
    x: MARGIN_X,
    y,
    size: 18,
    font: bold,
    color: INK,
  });
  y -= 18;

  const ledeLines = wrapText(copy.lede, regular, 10, ctx.maxWidth);
  for (const line of ledeLines) {
    page.drawText(line, { x: MARGIN_X, y, size: 10, font: regular, color: INK_MUTED });
    y -= 13;
  }
  y -= 10;

  const companyLine = input.company.nombre.trim()
    ? `${input.company.nombre}${input.company.nit.trim() ? `  ·  NIT ${input.company.nit}` : ""}`
    : copy.companyPending;
  page.drawText(companyLine, {
    x: MARGIN_X,
    y,
    size: 11,
    font: bold,
    color: INK,
  });
  y -= 14;

  const generated = copy.generatedAt.replace(
    "{date}",
    new Date().toLocaleDateString(input.locale, { dateStyle: "long" }),
  );
  page.drawText(generated, {
    x: MARGIN_X,
    y,
    size: 9,
    font: regular,
    color: INK_MUTED,
  });
  y -= 18;

  const summary =
    openCount > 0
      ? copy.openSummary.replace("{count}", String(openCount))
      : copy.allDoneSummary;
  page.drawText(summary, {
    x: MARGIN_X,
    y,
    size: 10,
    font: bold,
    color: openCount > 0 ? ACCENT : INK,
  });
  y -= 13;

  const hintLines = wrapText(copy.openHint, italic, 9, ctx.maxWidth);
  for (const line of hintLines) {
    page.drawText(line, { x: MARGIN_X, y, size: 9, font: italic, color: INK_MUTED });
    y -= 11;
  }

  y -= 14;
  ctx.y = y;
  drawTableHeader(ctx);
}

function estimateRowHeight(row: PreparedRow, ctx: PdfContext): number {
  const cols = columnWidths(ctx.maxWidth);
  const titleLines = wrapText(row.title, ctx.bold, 10, cols.decision - 6);
  const questionLines = wrapText(row.question, ctx.regular, 8, cols.decision - 6);
  const valueLines = wrapText(
    row.isDefault ? `${row.value} (${ctx.copy.defaultTag})` : row.value,
    ctx.bold,
    9.5,
    cols.value - 6,
  );
  const whereLines = [
    ...wrapText(row.docTitle, ctx.regular, 8, cols.where - 4),
    ...wrapText(row.articleTitle, ctx.regular, 8, cols.where - 4),
  ];
  const left = titleLines.length * 12 + questionLines.length * 10 + 4;
  const mid = valueLines.length * 11;
  const right = whereLines.length * 10;
  return Math.max(left, mid, right, 28) + 10;
}

function drawDecisionRow(ctx: PdfContext, row: PreparedRow, index: number) {
  const cols = columnWidths(ctx.maxWidth);
  const rowHeight = estimateRowHeight(row, ctx);
  ensureSpace(ctx, rowHeight + 4);

  const top = ctx.y;
  const num = String(index + 1);
  ctx.page.drawText(num, {
    x: MARGIN_X,
    y: top - 2,
    size: 9,
    font: ctx.bold,
    color: INK_MUTED,
  });

  let yDecision = top - 2;
  for (const line of wrapText(row.title, ctx.bold, 10, cols.decision - 6)) {
    ctx.page.drawText(line, {
      x: MARGIN_X + cols.num,
      y: yDecision,
      size: 10,
      font: ctx.bold,
      color: INK,
    });
    yDecision -= 12;
  }
  yDecision -= 2;
  for (const line of wrapText(row.question, ctx.regular, 8, cols.decision - 6)) {
    ctx.page.drawText(line, {
      x: MARGIN_X + cols.num,
      y: yDecision,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });
    yDecision -= 10;
  }

  let yValue = top - 2;
  const valueText = row.isDefault ? `${row.value} (${ctx.copy.defaultTag})` : row.value;
  for (const line of wrapText(valueText, ctx.bold, 9.5, cols.value - 6)) {
    ctx.page.drawText(line, {
      x: MARGIN_X + cols.num + cols.decision,
      y: yValue,
      size: 9.5,
      font: ctx.bold,
      color: INK,
    });
    yValue -= 11;
  }

  let yWhere = top - 2;
  const whereX = MARGIN_X + cols.num + cols.decision + cols.value;
  for (const line of wrapText(row.docTitle, ctx.regular, 8, cols.where - 4)) {
    ctx.page.drawText(line, {
      x: whereX,
      y: yWhere,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });
    yWhere -= 10;
  }
  for (const line of wrapText(row.articleTitle, ctx.regular, 8, cols.where - 4)) {
    ctx.page.drawText(line, {
      x: whereX,
      y: yWhere,
      size: 8,
      font: ctx.italic,
      color: INK_MUTED,
    });
    yWhere -= 10;
  }

  ctx.y = top - rowHeight;
  drawRule(ctx.page, ctx.y + 4, 0.4);
  ctx.y -= 2;
}

function drawDisclaimer(ctx: PdfContext) {
  const lines = wrapText(ctx.copy.disclaimer, ctx.regular, 8, ctx.maxWidth);
  ensureSpace(ctx, lines.length * 10 + 28);

  ctx.y -= 10;
  drawRule(ctx.page, ctx.y, 0.75, RULE);
  ctx.y -= 14;

  for (const line of lines) {
    ensureSpace(ctx, 12);
    ctx.page.drawText(line, {
      x: MARGIN_X,
      y: ctx.y,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });
    ctx.y -= 10;
  }
}

function drawFooters(ctx: PdfContext) {
  const pages = ctx.pdfDoc.getPages();
  const total = pages.length;
  pages.forEach((page, index) => {
    const footerY = 24;
    page.drawLine({
      start: { x: MARGIN_X, y: FOOTER_HEIGHT },
      end: { x: PAGE_WIDTH - MARGIN_X, y: FOOTER_HEIGHT },
      thickness: 0.5,
      color: LINE,
    });

    page.drawText(ctx.copy.footerLeft, {
      x: MARGIN_X,
      y: footerY,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });

    const center = ctx.firmName;
    const centerWidth = ctx.regular.widthOfTextAtSize(center, 8);
    page.drawText(center, {
      x: (PAGE_WIDTH - centerWidth) / 2,
      y: footerY,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });

    const pageLabel = `${index + 1} / ${total}`;
    const pageWidth = ctx.regular.widthOfTextAtSize(pageLabel, 8);
    page.drawText(pageLabel, {
      x: PAGE_WIDTH - MARGIN_X - pageWidth,
      y: footerY,
      size: 8,
      font: ctx.regular,
      color: INK_MUTED,
    });
  });
}

export async function buildReviewDraftPdf(input: ReviewDraftPdfInput): Promise<Uint8Array> {
  const copy = getCopy(input.locale);
  const rows = prepareRows(input);
  const openCount = rows.filter((row) => row.isDefault).length;

  const pdfDoc = await PDFDocument.create();
  const regular = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const bold = await pdfDoc.embedFont(StandardFonts.TimesRomanBold);
  const italic = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);

  const ctx: PdfContext = {
    pdfDoc,
    page: pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]),
    pageIndex: 0,
    y: PAGE_HEIGHT - MARGIN_TOP,
    contentBottom: MARGIN_X + FOOTER_HEIGHT,
    regular,
    bold,
    italic,
    maxWidth: PAGE_WIDTH - MARGIN_X * 2,
    copy,
    brandName: input.brandName,
    firmName: input.firmName,
  };

  drawHeader(ctx, input, openCount);
  rows.forEach((row, index) => drawDecisionRow(ctx, row, index));
  drawDisclaimer(ctx);
  drawFooters(ctx);

  return pdfDoc.save();
}
