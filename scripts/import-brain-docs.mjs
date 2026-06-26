#!/usr/bin/env node
/**
 * Import .docx brain sources → docs/brain/<slug>.md
 * Usage: node scripts/import-brain-docs.mjs [sources-dir]
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const brainRoot = path.join(root, "docs", "brain");
const sourcesDir = process.argv[2] ?? path.join(brainRoot, "sources");

function docxToText(filePath) {
  const zip = require("adm-zip");
  const { XMLParser } = require("fast-xml-parser");
  const zipFile = new zip(filePath);
  const xml = zipFile.readAsText("word/document.xml");
  const parser = new XMLParser({ ignoreAttributes: false });
  const doc = parser.parse(xml);
  const body = doc["w:document"]?.["w:body"]?.["w:p"] ?? [];
  const paragraphs = (Array.isArray(body) ? body : [body])
    .map((p) => {
      const runs = p?.["w:r"] ?? [];
      const runList = Array.isArray(runs) ? runs : [runs];
      return runList
        .map((r) => r?.["w:t"])
        .filter(Boolean)
        .join("");
    })
    .filter(Boolean);
  return paragraphs.join("\n\n");
}

if (!existsSync(sourcesDir)) {
  mkdirSync(sourcesDir, { recursive: true });
  console.log(`Created ${sourcesDir} — drop .docx files here and re-run.`);
  process.exit(0);
}

const files = readdirSync(sourcesDir).filter((f) => f.toLowerCase().endsWith(".docx"));
if (files.length === 0) {
  console.log(`No .docx files in ${sourcesDir}`);
  process.exit(0);
}

for (const file of files) {
  const slug = file
    .replace(/\.docx$/i, "")
    .toLowerCase()
    .replace(/platform_brain_/i, "")
    .replace(/platform context/i, "01-context")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const outName = slug.match(/^\d{2}-/) ? `${slug}.md` : `ext-${slug}.md`;
  const text = docxToText(path.join(sourcesDir, file));
  const outPath = outName.startsWith("ext-")
    ? path.join(brainRoot, "extensions", outName)
    : path.join(brainRoot, outName);

  if (outName.startsWith("ext-")) {
    mkdirSync(path.join(brainRoot, "extensions"), { recursive: true });
  }

  const content = `# Brain document: ${slug}\n\n_Source: ${file}_\n\n${text}\n`;
  writeFileSync(outPath, content);
  console.log(`Wrote ${path.relative(root, outPath)}`);

  if (!outName.startsWith("ext-")) {
    console.log(`  → Add to manifest.json loadOrder/documents if new: "${slug.replace(/^\d{2}-/, (m) => m)}"`);
  }
}

console.log("\nDone. Restart dev server to pick up changes.");
