# Due diligence firm sources

Word exports from Balam Legal / Yamale (2026-08-06) for the DD workflow (not founder Templates).

| File | Product role |
| --- | --- |
| `20260806 - DD Playbook.docx` | Firm/AI review playbook (server-only) |
| `20260806 - Requerimiento de Información DD - Info Request.docx` | Target upload checklist (RDI) |
| `20260806 DD Report.docx` | Bilingual findings report skeleton |

Extracted text lives in `extracted/`. Runtime modules:

- RDI → `src/lib/dd/taxonomy.ts` + coverage UI
- Playbook → `src/lib/dd/playbook.ts` (never client-fetched as raw master)
- Report → `src/lib/dd/report.ts` (server-side render from findings + assessment)

Locale: sources are bilingual (ES/EN interleaved or sequential). Product UI uses next-intl; report body can emit both columns.
