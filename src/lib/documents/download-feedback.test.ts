import { describe, expect, it } from "vitest";

function isValidEaseRating(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1 && value <= 5;
}

describe("document download feedback validation", () => {
  it("accepts integer ratings 1–5", () => {
    expect(isValidEaseRating(1)).toBe(true);
    expect(isValidEaseRating(5)).toBe(true);
  });

  it("rejects out-of-range or non-integer ratings", () => {
    expect(isValidEaseRating(0)).toBe(false);
    expect(isValidEaseRating(6)).toBe(false);
    expect(isValidEaseRating(2.5)).toBe(false);
    expect(isValidEaseRating("3")).toBe(false);
  });
});
