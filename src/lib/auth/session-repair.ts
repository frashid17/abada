export const CLERK_SESSION_REPAIR_KEY = "abada-clerk-session-repair";

export function clearClerkSessionRepairFlag(): void {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.removeItem(CLERK_SESSION_REPAIR_KEY);
}
