# Platform brain documents

System prompts for the AI gateway are assembled from this folder at runtime.

## Current documents

| ID | File | Status |
| --- | --- | --- |
| `01-context` | `01-context.md` | Loaded |
| `02-voice` | `02-voice.md` | Loaded |
| `03-memory` | `03-memory.md` | Loaded |

Future slots (add to `manifest.json` when ready): System Operating, Legal Reasoning, Guardrails/Ethics, Knowledge Architecture, Workflow Playbooks.

## Add a new brain document

### Option A — Markdown directly (fastest)

1. Add `04-your-topic.md` (or place in `extensions/` for auto-discovery).
2. Register it in `docs/brain/manifest.json`:
   - Add the id to `loadOrder`
   - Add a `documents` entry with `"enabled": true`
3. Restart the dev server (brain is read from disk; cached in production until redeploy).

### Option B — Import from Word

1. Drop `.docx` files in `docs/brain/sources/` (create the folder if needed).
2. Run:

```bash
npm run brain:import
```

3. The script writes `docs/brain/<slug>.md` and prints manifest snippets to paste into `manifest.json`.

### Corpus inventory (spreadsheet)

Update `Platform_Corpus_AI_Training_Inventory.xlsx`, then:

```bash
npm run brain:import-corpus -- /path/to/Platform_Corpus_AI_Training_Inventory.xlsx
```

This regenerates `corpus/inventory.json`. The full inventory is **not** injected on every AI call — it is used for gap tracking and retrieval scaffolding.

## What the gateway loads

- **Always:** enabled documents in `manifest.loadOrder`, then any `extensions/*.md`.
- **On demand:** `corpus/inventory.json` via `loadCorpusInventory()` for tasks that need corpus awareness.

## Confidentiality

Brain markdown in this repo is firm-confidential. Do not expose raw brain files to the client — they are server-side only.
