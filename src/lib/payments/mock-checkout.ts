import { z } from "zod";

export type MockPaymentMethod = "card" | "nequi" | "daviplata";

const cardSchema = z.object({
  method: z.literal("card"),
  cardholderName: z.string().trim().min(2).max(80),
  cardNumber: z.string().regex(/^\d{13,19}$/),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/\d{2}$/),
  cvc: z.string().regex(/^\d{3,4}$/),
});

const mobileSchema = z.object({
  method: z.enum(["nequi", "daviplata"]),
  phone: z.string().regex(/^3\d{9}$/, "Colombian mobile must be 10 digits starting with 3"),
});

export const mockCheckoutBodySchema = z.discriminatedUnion("method", [cardSchema, mobileSchema]);

export type MockCheckoutBody = z.infer<typeof mockCheckoutBodySchema>;

/** Luhn check — rejects obviously invalid card numbers while accepting test PANs. */
export function isValidCardNumber(digits: string): boolean {
  if (!/^\d{13,19}$/.test(digits)) return false;
  let sum = 0;
  let alternate = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let n = Number(digits[i]);
    if (alternate) {
      n *= 2;
      if (n > 9) n -= 9;
    }
    sum += n;
    alternate = !alternate;
  }
  return sum % 10 === 0;
}

export function sanitizeCardNumber(raw: string): string {
  return raw.replace(/\D/g, "");
}

export function sanitizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  // Strip leading country code 57 if present
  if (digits.length === 12 && digits.startsWith("57")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("57")) return digits.slice(2);
  return digits;
}

export function mockProcessingDelayMs(): number {
  return 900 + Math.floor(Math.random() * 600);
}
