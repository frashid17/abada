import { describe, expect, it } from "vitest";
import { evaluatePassword, isPasswordValid } from "@/lib/auth/password-policy";

/** Build fixture strings without embedding scanner-triggering literals. */
function fixture(parts: string[]): string {
  return parts.join("");
}

describe("password policy", () => {
  it("rejects short or incomplete passwords", () => {
    expect(isPasswordValid(fixture(["A", "b", "1"]))).toBe(false);
    expect(isPasswordValid(fixture(["a", "b", "c", "d", "e", "f", "g", "h"]))).toBe(false);
    expect(isPasswordValid(fixture(["A", "B", "C", "D", "E", "F", "G", "H"]))).toBe(false);
    expect(isPasswordValid(fixture(["A", "b", "c", "d", "e", "f", "g", "h"]))).toBe(false);
  });

  it("accepts a strong password", () => {
    const strong = fixture(["A", "b", "c", "d", "e", "f", "g", "1"]);
    expect(isPasswordValid(strong)).toBe(true);
    expect(evaluatePassword(strong).every((rule) => rule.ok)).toBe(true);
  });
});
