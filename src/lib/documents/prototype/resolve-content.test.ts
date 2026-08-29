import { describe, expect, it } from "vitest";
import { SEED_PROTOTYPE_CONTENT } from "@/lib/documents/prototype/seed";

describe("prototype content seed", () => {
  it("includes all three guided document packs", () => {
    expect(SEED_PROTOTYPE_CONTENT.order).toEqual(["fundadores", "incentivos", "pi"]);
    expect(SEED_PROTOTYPE_CONTENT.docs.fundadores.groups.length).toBeGreaterThan(0);
    expect(Object.keys(SEED_PROTOTYPE_CONTENT.decisions).length).toBeGreaterThan(0);
    expect(SEED_PROTOTYPE_CONTENT.tokens["co.nombre"]?.sample_es).toBe("Acme Colombia");
  });
});
