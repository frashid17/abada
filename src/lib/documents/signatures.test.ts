import { describe, expect, it } from "vitest";
import { buildPartySignatures } from "@/lib/documents/signatures";

describe("buildPartySignatures", () => {
  it("returns both NDA parties", () => {
    const parties = buildPartySignatures("nda", {
      company_name: "Acme SAS",
      counterparty_name: "Beta Fund",
      agreement_mode: "mutual",
    });

    expect(parties).toHaveLength(2);
    expect(parties[0]?.name).toBe("Acme SAS");
    expect(parties[1]?.name).toBe("Beta Fund");
  });

  it("returns company and founder for vesting", () => {
    const parties = buildPartySignatures("vesting", {
      company_representative: "Ana López",
      founder_name: "Carlos Ruiz",
    });

    expect(parties[0]?.name).toBe("Ana López");
    expect(parties[1]?.name).toBe("Carlos Ruiz");
  });
});
