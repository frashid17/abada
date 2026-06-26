import { getEnv } from "@/lib/env";

export function getBrandName(): string {
  return getEnv("NEXT_PUBLIC_BRAND_NAME", "Abada");
}

export function getFirmName(): string {
  return getEnv("NEXT_PUBLIC_FIRM_NAME", "Balam Legal");
}
