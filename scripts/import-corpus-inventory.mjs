#!/usr/bin/env node
/**
 * Regenerate docs/brain/corpus/inventory.json from the Excel workbook.
 * Usage: node scripts/import-corpus-inventory.mjs [/path/to/workbook.xlsx]
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const defaultXlsx = path.join(root, "docs", "brain", "sources", "Platform_Corpus_AI_Training_Inventory.xlsx");
const xlsxPath = process.argv[2] ?? defaultXlsx;
const outDir = path.join(root, "docs", "brain", "corpus");

const readXlsxFile = require("read-excel-file/node");
const { readSheetNames } = require("read-excel-file/node");

const skip = new Set(["README", "Summary"]);
const inventory = {};
const summary = { total: 0, by_status: {}, by_priority: {} };

function bump(obj, key) {
  if (key) obj[key] = (obj[key] ?? 0) + 1;
}

function cellValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

const sheetNames = await readSheetNames(xlsxPath);

for (const sheet of sheetNames) {
  if (skip.has(sheet)) continue;
  const rows = await readXlsxFile(xlsxPath, { sheet });
  let headers = null;
  const items = [];
  for (const row of rows) {
    if (!row?.length) continue;
    if (!headers && cellValue(row[0]) === "ID") {
      headers = row.map((h) => cellValue(h));
      continue;
    }
    if (!headers || !row[0] || cellValue(row[0]) === "ID") continue;
    const item = {};
    headers.forEach((h, i) => {
      if (h) item[h] = cellValue(row[i]);
    });
    if (item.ID) {
      items.push(item);
      summary.total += 1;
      bump(summary.by_status, item.Status);
      bump(summary.by_priority, item.Priority);
    }
  }
  const key = sheet.toLowerCase().replace(/\s+/g, "-");
  inventory[key] = { sheet, count: items.length, items };
}

mkdirSync(outDir, { recursive: true });
const payload = {
  version: "2.0",
  source: path.basename(xlsxPath),
  summary,
  categories: inventory,
};
writeFileSync(path.join(outDir, "inventory.json"), JSON.stringify(payload, null, 2));
console.log(`Wrote corpus/inventory.json (${summary.total} items)`);
