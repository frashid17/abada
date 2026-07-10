# Legal sources corpus

Platform-wide Colombian legal texts for AI retrieval and citation grounding.

## Layout

- `manifest.json` — bilingual catalog (titles, citations, descriptions) for all sources
- `pdfs/` — source PDFs (gitignored; copied on ingest)
- `chunks/{sourceId}/es-CO.json` — authoritative Spanish article chunks
- `chunks/{sourceId}/en-US.json` — English mirror (structure + pending translation flag)
- `index.json` — ingest summary (chunk counts, timestamps)

## Ingest

Requires [poppler](https://poppler.freedesktop.org/) (`pdftotext` on PATH).

```bash
npm run corpus:ingest -- "/path/to/Laws - Regulations"
```

Single source:

```bash
npm run corpus:ingest -- --source ley-1258-2008 "/path/to/Laws - Regulations"
```

Spanish text is extracted from PDF. English chunks carry the same article structure with `translationStatus: "pending"` until a firm attorney reviews machine or human translation (`TODO(legal)`).

## Bilingual model

| Locale | Role |
| --- | --- |
| `es-CO` | Official extracted text — cite for authoritative wording |
| `en-US` | Parallel chunks for English UI / prompts; body pending legal review |

Do not cite laws not in this corpus. Mark gaps as `TODO(legal)`.
