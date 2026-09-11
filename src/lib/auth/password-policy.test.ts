import { describe, expect, it } from "vitest";
import { evaluatePassword, isPasswordValid } from "@/lib/auth/password-policy";

describe("password policy", () => {
  it("rejects short or incomplete passwords", () => {
    expect(isPasswordValid("Ab1")).toBe(false);
    expect(isPasswordValid("abcdefgh")).toBe(false);
    expect(isPasswordValid("ABCDEFGH")).toBe(false);
    expect(isPasswordValid("Abcdefgh")).toBe(false);
  });

  it("accepts a strong password", () => {
    expect(isPasswordValid("Abcdefg1")).toBe(true);
    expect(evaluatePassword("Abcdefg1").every((rule) => rule.ok)).toBe(true);
  });
});
