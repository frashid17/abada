export type PasswordRuleId = "minLength" | "lower" | "upper" | "number";

export type PasswordRuleResult = {
  id: PasswordRuleId;
  ok: boolean;
};

export const PASSWORD_MIN_LENGTH = 8;

/** Client-side password policy (aligned with Clerk-friendly strength). */
export function evaluatePassword(password: string): PasswordRuleResult[] {
  return [
    { id: "minLength", ok: password.length >= PASSWORD_MIN_LENGTH },
    { id: "lower", ok: /[a-z]/.test(password) },
    { id: "upper", ok: /[A-Z]/.test(password) },
    { id: "number", ok: /\d/.test(password) },
  ];
}

export function isPasswordValid(password: string): boolean {
  return evaluatePassword(password).every((rule) => rule.ok);
}
