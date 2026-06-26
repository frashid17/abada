import { describe, expect, it } from "vitest";
import { buildDataRoomStoragePath } from "@/lib/data-room/storage";
import { calculateRevenueSplits, mapWompiTransactionStatus } from "@/lib/payments/wompi-utils";

describe("buildDataRoomStoragePath", () => {
  it("builds a versioned path under deal and taxonomy", () => {
    expect(
      buildDataRoomStoragePath("deal-1", "Corporate", "Cap Table.xlsx", 2),
    ).toBe("deals/deal-1/corporate/v2/Cap_Table.xlsx");
  });
});

describe("calculateRevenueSplits", () => {
  it("allocates 80% firm / 20% platform by default", () => {
    const splits = calculateRevenueSplits(100_000, "COP", "tenant-uuid");
    expect(splits).toHaveLength(2);
    expect(splits[0]).toMatchObject({ party: "tenant:tenant-uuid", amountCents: 80_000 });
    expect(splits[1]).toMatchObject({ party: "platform", amountCents: 20_000 });
  });
});

describe("mapWompiTransactionStatus", () => {
  it("maps approved to captured", () => {
    expect(mapWompiTransactionStatus("APPROVED")).toBe("captured");
  });
});
