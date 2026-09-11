import type { UserContext } from "@/types/database";

const USER_CONTEXTS: UserContext[] = ["founder", "investor", "firm"];

export function isUserContext(value: unknown): value is UserContext {
  return typeof value === "string" && USER_CONTEXTS.includes(value as UserContext);
}

export function parseUserContext(value: unknown): UserContext | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return isUserContext(normalized) ? normalized : null;
}
