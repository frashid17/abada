import { cookies } from "next/headers";
import { PREFERRED_CONTEXT_COOKIE } from "@/lib/auth/preferred-context-cookie-name";
import { parseUserContext } from "@/lib/auth/user-context";
import type { UserContext } from "@/types/database";

export { PREFERRED_CONTEXT_COOKIE };

export async function readPreferredContextCookie(): Promise<UserContext | null> {
  const store = await cookies();
  return parseUserContext(store.get(PREFERRED_CONTEXT_COOKIE)?.value);
}
