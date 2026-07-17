import { execFile, execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { normalizeLegalWhitespace } from "@/lib/legal-corpus/chunk-text";

const execFileAsync = promisify(execFile);

export type PdfExtractMethod = "text_layer" | "ocr";

export type PdfExtractResult = {
  text: string;
  method: PdfExtractMethod;
  pageCount: number;
};

const MAX_OCR_PAGES = 80;
/** Below this many characters per page, treat as scanned and run OCR. */
const SPARSE_CHARS_PER_PAGE = 80;

function commandExists(bin: string): boolean {
  try {
    execFileSync("which", [bin], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

function countFormFeeds(text: string): number {
  const matches = text.match(/\f/g);
  return matches ? matches.length + 1 : 1;
}

async function pdfPageCount(pdfPath: string): Promise<number> {
  if (!commandExists("pdfinfo")) return 0;
  try {
    const { stdout } = await execFileAsync("pdfinfo", [pdfPath], {
      encoding: "utf8",
      maxBuffer: 2 * 1024 * 1024,
    });
    const match = stdout.match(/Pages:\s+(\d+)/i);
    return match ? Number(match[1]) : 0;
  } catch {
    return 0;
  }
}

async function extractTextLayer(pdfPath: string): Promise<string> {
  if (!commandExists("pdftotext")) {
    throw new Error("pdftotext_missing");
  }
  const { stdout } = await execFileAsync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
  });
  return stdout;
}

async function extractViaOcr(pdfPath: string, pageCountHint: number): Promise<string> {
  if (!commandExists("pdftoppm") || !commandExists("tesseract")) {
    throw new Error("ocr_tools_missing");
  }

  const workDir = mkdtempSync(path.join(tmpdir(), "abada-ocr-"));
  try {
    const prefix = path.join(workDir, "page");
    const dpi = pageCountHint > 40 ? "150" : "200";
    await execFileAsync("pdftoppm", ["-png", "-r", dpi, pdfPath, prefix], {
      maxBuffer: 20 * 1024 * 1024,
    });

    const pages = readdirSync(workDir)
      .filter((name) => name.startsWith("page") && name.endsWith(".png"))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

    if (pages.length === 0) {
      throw new Error("ocr_no_pages");
    }

    const limited = pages.slice(0, MAX_OCR_PAGES);
    const parts: string[] = [];

    for (const page of limited) {
      const imagePath = path.join(workDir, page);
      const { stdout } = await execFileAsync(
        "tesseract",
        [imagePath, "stdout", "-l", "spa+eng", "--psm", "1"],
        {
          encoding: "utf8",
          maxBuffer: 10 * 1024 * 1024,
        },
      );
      parts.push(stdout);
    }

    return parts.join("\n\f\n");
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

/**
 * Extract Spanish legal text from a PDF.
 * Uses the embedded text layer when dense enough; otherwise OCR via pdftoppm + tesseract.
 */
export async function extractTextFromPdf(pdfBytes: Buffer): Promise<PdfExtractResult> {
  if (pdfBytes.length < 5 || pdfBytes.subarray(0, 4).toString() !== "%PDF") {
    throw new Error("invalid_pdf");
  }

  const workDir = mkdtempSync(path.join(tmpdir(), "abada-pdf-"));
  const pdfPath = path.join(workDir, "source.pdf");

  try {
    writeFileSync(pdfPath, pdfBytes);

    const reportedPages = await pdfPageCount(pdfPath);
    let textLayer = "";
    try {
      textLayer = await extractTextLayer(pdfPath);
    } catch (error) {
      if (error instanceof Error && error.message === "pdftotext_missing") {
        throw error;
      }
      textLayer = "";
    }

    const normalized = normalizeLegalWhitespace(textLayer);
    const pageCount = reportedPages || countFormFeeds(textLayer) || 1;
    const charsPerPage = normalized.length / Math.max(pageCount, 1);
    const needsOcr = normalized.length < 200 || charsPerPage < SPARSE_CHARS_PER_PAGE;

    if (!needsOcr) {
      return { text: normalized, method: "text_layer", pageCount };
    }

    const ocrText = normalizeLegalWhitespace(await extractViaOcr(pdfPath, pageCount));
    if (!ocrText) {
      throw new Error("ocr_empty");
    }

    return {
      text: ocrText,
      method: "ocr",
      pageCount: reportedPages || countFormFeeds(ocrText) || pageCount,
    };
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

/** Sync helper used by unit tests / scripts — text-layer only. */
export function extractTextFromPdfFileSync(pdfPath: string): string {
  return normalizeLegalWhitespace(
    execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    }),
  );
}

export function pdfToolsAvailable(): {
  pdftotext: boolean;
  pdftoppm: boolean;
  tesseract: boolean;
} {
  return {
    pdftotext: commandExists("pdftotext"),
    pdftoppm: commandExists("pdftoppm"),
    tesseract: commandExists("tesseract"),
  };
}
