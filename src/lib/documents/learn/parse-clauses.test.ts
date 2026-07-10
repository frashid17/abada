import { describe, expect, it } from "vitest";
import { parseDocumentClauses } from "@/lib/documents/learn/parse-clauses";

const sampleBody = `ACUERDO DE ACCIONISTAS

Entre los Accionistas de Demo S.A.S., se celebra el presente acuerdo.

1. OBJETO

Regular los derechos entre Accionistas.

2. RESTRICCIÓN A LA TRANSFERENCIA

Ningún Accionista podrá transferir sin preferencia.`;

describe("parseDocumentClauses", () => {
  it("splits preamble and numbered clauses", () => {
    const clauses = parseDocumentClauses(sampleBody);
    expect(clauses).toHaveLength(3);
    expect(clauses[0]?.id).toBe("preamble");
    expect(clauses[1]?.id).toBe("1");
    expect(clauses[2]?.id).toBe("2");
    expect(clauses[1]?.body).toContain("Regular los derechos");
  });
});
