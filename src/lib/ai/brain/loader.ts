import { readFileSync, readdirSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  BrainManifest,
  BrainSystemPrompt,
  CorpusInventory,
  LoadedBrainDocument,
} from "./types";

const BRAIN_ROOT = path.join(process.cwd(), "docs", "brain");

let manifestCache: BrainManifest | null = null;
let brainPromptCache: BrainSystemPrompt | null = null;

function readBrainManifest(): BrainManifest {
  if (manifestCache) return manifestCache;
  const manifestPath = path.join(BRAIN_ROOT, "manifest.json");
  manifestCache = JSON.parse(readFileSync(manifestPath, "utf8")) as BrainManifest;
  return manifestCache;
}

function readMarkdownFile(relativePath: string): string {
  const fullPath = path.join(BRAIN_ROOT, relativePath);
  if (!existsSync(fullPath)) {
    throw new Error(`Brain file not found: ${relativePath}`);
  }
  return readFileSync(fullPath, "utf8");
}

function loadExtensionDocuments(): LoadedBrainDocument[] {
  const manifest = readBrainManifest();
  if (!manifest.extensions?.enabled) return [];

  const extDir = path.join(BRAIN_ROOT, manifest.extensions.directory);
  if (!existsSync(extDir)) return [];

  return readdirSync(extDir)
    .filter((name) => name.endsWith(".md"))
    .sort()
    .map((name) => ({
      id: `ext:${name.replace(/\.md$/, "")}`,
      title: name,
      content: readFileSync(path.join(extDir, name), "utf8"),
      source: "extension" as const,
    }));
}

/**
 * Load all enabled brain documents per manifest.json (+ extensions/).
 * Server-side only — never send raw brain files to the client.
 */
export function loadBrainDocuments(options?: { refresh?: boolean }): LoadedBrainDocument[] {
  if (options?.refresh) {
    manifestCache = null;
    brainPromptCache = null;
  }

  const manifest = readBrainManifest();
  const loaded: LoadedBrainDocument[] = [];
  const missingRequired: string[] = [];

  for (const id of manifest.loadOrder) {
    const meta = manifest.documents[id];
    if (!meta || meta.enabled === false) continue;

    try {
      loaded.push({
        id,
        title: meta.title,
        content: readMarkdownFile(meta.file),
        source: "manifest",
        series: meta.series,
        tags: meta.tags,
      });
    } catch {
      if (meta.required) missingRequired.push(id);
    }
  }

  for (const doc of manifest.loadOrder) {
    const meta = manifest.documents[doc];
    if (meta?.required && meta.enabled !== false && !loaded.some((d) => d.id === doc)) {
      if (!missingRequired.includes(doc)) missingRequired.push(doc);
    }
  }

  if (missingRequired.length > 0) {
    console.warn("[brain] Missing required documents:", missingRequired.join(", "));
  }

  loaded.push(...loadExtensionDocuments());
  return loaded;
}

export function loadBrainSystemPrompt(options?: { refresh?: boolean }): BrainSystemPrompt {
  if (!options?.refresh && brainPromptCache) return brainPromptCache;

  const documents = loadBrainDocuments(options);
  const manifest = readBrainManifest();
  const missingRequired = manifest.loadOrder.filter((id) => {
    const meta = manifest.documents[id];
    return meta?.required && meta.enabled !== false && !documents.some((d) => d.id === id);
  });

  const combined = documents
    .map((doc) => `## ${doc.title} (${doc.id})\n\n${doc.content}`)
    .join("\n\n---\n\n");

  brainPromptCache = { documents, combined, missingRequired };
  return brainPromptCache;
}

export function loadCorpusInventory(): CorpusInventory | null {
  const manifest = readBrainManifest();
  if (!manifest.corpus?.enabled) return null;

  const inventoryPath = path.join(BRAIN_ROOT, manifest.corpus.inventoryFile);
  if (!existsSync(inventoryPath)) return null;

  return JSON.parse(readFileSync(inventoryPath, "utf8")) as CorpusInventory;
}

/** Condensed corpus summary for prompts that need gap awareness without full JSON. */
export function summarizeCorpusInventory(inventory: CorpusInventory): string {
  const lines = [
    `Corpus inventory v${inventory.version} (${inventory.summary?.total ?? 0} items).`,
    "Categories:",
  ];

  for (const category of Object.values(inventory.categories)) {
    const critical = category.items.filter((i) => i.Priority === "CRITICAL").length;
    const create = category.items.filter((i) => i.Status === "CREATE").length;
    lines.push(`- ${category.sheet}: ${category.count} items (${critical} critical, ${create} to create)`);
  }

  lines.push(
    "Do not cite laws or cases not in the provided corpus. Mark gaps as TODO(legal).",
  );

  return lines.join("\n");
}

export function listPendingBrainSlots(): Array<{ id: string; title: string; status: string }> {
  const manifest = readBrainManifest();
  if (!manifest.placeholders) return [];
  return Object.entries(manifest.placeholders).map(([id, value]) => ({
    id,
    title: value.title,
    status: value.status,
  }));
}

/** Test helper — clears in-memory cache between test cases. */
export function clearBrainCache(): void {
  manifestCache = null;
  brainPromptCache = null;
}
