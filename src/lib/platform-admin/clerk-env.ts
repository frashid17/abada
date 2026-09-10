export type ClerkKeyMode = "test" | "live" | "unknown";

export function detectClerkKeyMode(): ClerkKeyMode {
  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? "";
  if (key.startsWith("pk_test_")) return "test";
  if (key.startsWith("pk_live_")) return "live";
  return "unknown";
}

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function parseAdminAllowlist(): string[] {
  return (process.env.PLATFORM_ADMIN_SUBS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
