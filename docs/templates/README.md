# Firm template sources

Word exports from Balam Legal / Yamale for founder document guides (`/fundador/documentos/guia`). Draftable docs (shareholders, employment) open in the unified Documents workspace with inline fields.

## Usable

| File | Learn type |
| --- | --- |
| `20260723 - Acuerdo de fundaodres - Founders Agreement.docx` | `founders` |
| `20260723 Contrato de Trabajo con PI y NDA - Employment Agreement.docx` | `employment` (learn) |
| `20260723 -Contrato Cliente Corporativo - B2C - Corporate Client.docx` | `corporate_client` |
| `20260723 Terminos de Uso - B2C - Terms and Conditions .docx` | `terms_of_use` |
| `20260806 - Cesión_de_PI_y_confidencialidad - IP Assignment.docx` | `ip_assignment` |
| `20260806 Acuerdo de Compensacion en Acciones - Equity Compensation Agreement.docx` | `equity_compensation` |
| `20260723 Guide - Acuerdo de Fundadores - Founders Agreement.docx` | guide bubbles (founders) |
| `20260723 Guide Other Docs - English.docx` | guide bubbles (employment, corporate client, terms, IP, equity) |

## Superseded (do not ship)

These July exports had the wrong body (Terms of Use). Kept only for provenance; use the `20260806` files above:

- `20260723 - Acuerdo de Compensacion en Acciones - Equity Compensation Plan.docx`
- `20260723 - Cesion de IP - IP Assignment Agreement .docx`

Master templates live in `src/lib/documents/templates/`. Clause guides live in `src/messages/*/founder.learn`.
