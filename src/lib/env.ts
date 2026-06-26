const requiredServerEnv = [
  "CLERK_SECRET_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
] as const;

const requiredPublicEnv = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
] as const;

type ServerEnvKey = (typeof requiredServerEnv)[number];
type PublicEnvKey = (typeof requiredPublicEnv)[number];

export function getEnv(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
}

export function getOptionalEnv(key: string): string | undefined {
  return process.env[key];
}

export function assertServerEnv(): void {
  for (const key of requiredServerEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }
}

export function assertPublicEnv(): void {
  for (const key of requiredPublicEnv) {
    if (!process.env[key]) {
      throw new Error(`Missing environment variable: ${key}`);
    }
  }
}

export type { PublicEnvKey, ServerEnvKey };
