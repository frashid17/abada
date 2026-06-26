import { auth } from "@clerk/nextjs/server";

/**
 * Clerk session usable for app access. Pending sessions (e.g. choose-organization
 * task) are treated as signed-out so we do not bounce between /firma and /iniciar-sesion.
 */
export async function getActiveSession() {
  return auth({ treatPendingAsSignedOut: true });
}

export async function hasActiveAppSession(): Promise<boolean> {
  const { userId } = await getActiveSession();
  return Boolean(userId);
}
