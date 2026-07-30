import { describe, expect, it } from "vitest";
import {
  createAiAccessToken,
  formatCopFromCents,
  verifyAiAccessToken,
} from "@/lib/payments/ai-access";
import {
  isValidCardNumber,
  mockCheckoutBodySchema,
  sanitizeCardNumber,
  sanitizePhone,
} from "@/lib/payments/mock-checkout";

describe("mock checkout validation", () => {
  it("accepts Visa test PAN via Luhn", () => {
    expect(isValidCardNumber("4242424242424242")).toBe(true);
    expect(isValidCardNumber("4111111111111111")).toBe(true);
    expect(isValidCardNumber("1234567890123456")).toBe(false);
  });

  it("sanitizes card and Colombian phone", () => {
    expect(sanitizeCardNumber("4242 4242 4242 4242")).toBe("4242424242424242");
    expect(sanitizePhone("+57 300 123 4567")).toBe("3001234567");
    expect(sanitizePhone("573001234567")).toBe("3001234567");
  });

  it("parses card and mobile money bodies", () => {
    expect(
      mockCheckoutBodySchema.parse({
        method: "card",
        cardholderName: "Ana Pérez",
        cardNumber: "4242424242424242",
        expiry: "12/28",
        cvc: "123",
      }).method,
    ).toBe("card");

    expect(
      mockCheckoutBodySchema.parse({
        method: "nequi",
        phone: "3001234567",
      }).method,
    ).toBe("nequi");
  });
});

describe("ai access token", () => {
  it("round-trips a signed entitlement token", () => {
    const userId = "user_abc123";
    const token = createAiAccessToken(userId);
    expect(verifyAiAccessToken(token, userId)).toBe(true);
    expect(verifyAiAccessToken(token, "other_user")).toBe(false);
    expect(verifyAiAccessToken("tampered.token.value", userId)).toBe(false);
  });

  it("formats COP from Wompi centavos", () => {
    const formatted = formatCopFromCents(4_990_000, "es-CO");
    expect(formatted).toBe("COP $49.900");
  });
});
