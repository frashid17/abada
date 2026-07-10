#!/usr/bin/env node
/**
 * Extract Colombian legal PDFs into bilingual chunk JSON for the platform corpus.
 *
 * Usage:
 *   node scripts/ingest-legal-sources.mjs [/path/to/Laws - Regulations]
 *   node scripts/ingest-legal-sources.mjs --source ley-1258-2008
 *
 * Requires: pdftotext (poppler) on PATH.
 * Spanish text is authoritative (extracted from PDF). English chunks mirror article
 * structure with bilingual headings; full English body translation is marked pending
 * until reviewed (TODO(legal)).
 */
import { execFileSync } from "node:child_process";
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const dataRoot = path.join(root, "data", "legal-sources");
const manifestPath = path.join(dataRoot, "manifest.json");
const defaultPdfDir = "/Users/fahimrashid/Documents/abada/Laws - Regulations";

const args = process.argv.slice(2);
const sourceFilter = args.includes("--source")
  ? args[args.indexOf("--source") + 1]
  : null;
const pdfDirArg = args.find((a) => !a.startsWith("--") && a !== sourceFilter);
const pdfDir = pdfDirArg ?? defaultPdfDir;

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));

const ARTICLE_SPLIT =
  /(?=\b(?:ART(?:ÍCULO|ICULO|\.|º|°)?\.?\s*\d+|Artículo\s+\d+|ARTICULO\s+\d+|CAPÍTULO\s+[IVXLC\d]+|CAPITULO\s+[IVXLC\d]+|TÍTULO\s+[IVXLC\d]+|TITULO\s+[IVXLC\d]+)\b)/gi;

function extractPdfText(pdfPath) {
  return execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
}

function normalizeWhitespace(text) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function parseArticleRef(heading) {
  const art = heading.match(
    /(?:ART(?:ÍCULO|ICULO|\.|º|°)?\.?\s*(\d+)|Artículo\s+(\d+)|ARTICULO\s+(\d+))/i,
  );
  if (art) return `Art. ${art[1] ?? art[2] ?? art[3]}`;
  const chapter = heading.match(/CAP[ÍI]TULO\s+([IVXLC\d]+)/i);
  if (chapter) return `Ch. ${chapter[1]}`;
  const title = heading.match(/T[ÍI]TULO\s+([IVXLC\d]+)/i);
  if (title) return `Title ${title[1]}`;
  return null;
}

function chunkText(rawText) {
  const text = normalizeWhitespace(rawText);
  if (!text) return [];

  const parts = text.split(ARTICLE_SPLIT).filter((p) => p.trim().length > 40);
  if (parts.length <= 1) {
    return [
      {
        articleRef: "preamble",
        heading: "Preamble",
        content: text.slice(0, 12000),
      },
    ];
  }

  return parts.map((part, index) => {
    const lines = part.trim().split("\n");
    const heading = lines[0]?.trim().slice(0, 200) ?? `Section ${index + 1}`;
    const body = lines.slice(1).join("\n").trim() || part.trim();
    const articleRef = parseArticleRef(heading) ?? `section-${index + 1}`;
    return {
      articleRef,
      heading,
      content: body.slice(0, 12000),
    };
  });
}

function buildLocaleChunks(source, esChunks, locale) {
  if (locale === "es-CO") {
    return esChunks.map((chunk, index) => ({
      sourceId: source.id,
      locale: "es-CO",
      chunkIndex: index,
      articleRef: chunk.articleRef,
      heading: chunk.heading,
      content: chunk.content,
      translationStatus: "official",
    }));
  }

  return esChunks.map((chunk, index) => {
    const enRef = chunk.articleRef.startsWith("Art.")
      ? chunk.articleRef.replace("Art.", "Art.")
      : chunk.articleRef;

    return {
      sourceId: source.id,
      locale: "en-US",
      chunkIndex: index,
      articleRef: enRef,
      heading: chunk.heading,
      content: chunk.content,
      translationStatus: "pending",
      officialLocale: "es-CO",
      translationNote:
        "Official Spanish text pending English legal review. Cite the Spanish source for authoritative wording.",
    };
  });
}

function ingestSource(source) {
  const srcPdf = path.join(pdfDir, source.pdfFilename);
  if (!existsSync(srcPdf)) {
    console.warn(`  SKIP — PDF not found: ${srcPdf}`);
    return null;
  }

  const pdfDestDir = path.join(dataRoot, "pdfs");
  mkdirSync(pdfDestDir, { recursive: true });
  const pdfDest = path.join(pdfDestDir, source.pdfFilename);
  if (!existsSync(pdfDest)) {
    copyFileSync(srcPdf, pdfDest);
  }

  console.log(`  Extracting ${source.id}…`);
  const rawText = extractPdfText(srcPdf);
  const esChunks = chunkText(rawText);

  const chunkDir = path.join(dataRoot, "chunks", source.id);
  mkdirSync(chunkDir, { recursive: true });

  const esPayload = {
    sourceId: source.id,
    locale: "es-CO",
    extractedAt: new Date().toISOString(),
    chunkCount: esChunks.length,
    chunks: buildLocaleChunks(source, esChunks, "es-CO"),
  };
  const enPayload = {
    sourceId: source.id,
    locale: "en-US",
    extractedAt: new Date().toISOString(),
    chunkCount: esChunks.length,
    chunks: buildLocaleChunks(source, esChunks, "en-US"),
  };

  writeFileSync(path.join(chunkDir, "es-CO.json"), JSON.stringify(esPayload, null, 2));
  writeFileSync(path.join(chunkDir, "en-US.json"), JSON.stringify(enPayload, null, 2));

  return {
    sourceId: source.id,
    chunkCount: esChunks.length,
    charCount: rawText.length,
  };
}

console.log(`Legal corpus ingest — PDF dir: ${pdfDir}`);
mkdirSync(path.join(dataRoot, "chunks"), { recursive: true });

const sources = sourceFilter
  ? manifest.sources.filter((s) => s.id === sourceFilter)
  : manifest.sources;

if (sources.length === 0) {
  console.error(`No source matched: ${sourceFilter}`);
  process.exit(1);
}

const summary = [];
for (const source of sources) {
  const result = ingestSource(source);
  if (result) summary.push(result);
}

const indexPath = path.join(dataRoot, "index.json");
const existingIndex = existsSync(indexPath)
  ? JSON.parse(readFileSync(indexPath, "utf8"))
  : { version: "1.0", sources: [] };

for (const row of summary) {
  const entry = {
    ...row,
    extractedAt: new Date().toISOString(),
  };
  const idx = existingIndex.sources.findIndex((s) => s.sourceId === row.sourceId);
  if (idx >= 0) existingIndex.sources[idx] = entry;
  else existingIndex.sources.push(entry);
}

writeFileSync(indexPath, JSON.stringify(existingIndex, null, 2));

console.log(`\nDone — ${summary.length} source(s) ingested.`);
for (const row of summary) {
  console.log(`  ${row.sourceId}: ${row.chunkCount} chunks, ${row.charCount.toLocaleString()} chars`);
}
