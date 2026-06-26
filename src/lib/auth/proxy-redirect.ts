/**
 * Optimistic sign-in redirect for proxy.ts only.
 * Real authorization is enforced in server components + RLS — not here.
 */
export function buildSignInRedirectUrl(requestUrl: string, signInPath?: string): URL {
  const signIn = signInPath ?? process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/iniciar-sesion";
  const url = new URL(signIn, requestUrl);
  url.searchParams.set("redirect_url", requestUrl);
  return url;
}
