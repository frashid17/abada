/** Normalize a path or URL to an absolute app URL. */
export function ensureAbsoluteAppUrl(pathOrUrl: string, origin?: string): string {
  const base = (origin ?? getAppOrigin()).replace(/\/$/, "");
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }
  const path = pathOrUrl.startsWith("/") ? pathOrUrl : `/${pathOrUrl}`;
  return `${base}${path}`;
}

export function getAppOrigin(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return (process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

/** Clerk must receive absolute URLs in dev — relative paths send users to accounts.dev. */
export function getClerkAuthConfig() {
  const origin = getAppOrigin();

  return {
    signInUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL ?? "/iniciar-sesion",
      origin,
    ),
    signUpUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL ?? "/registro",
      origin,
    ),
    signInFallbackRedirectUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL ?? "/onboarding",
      origin,
    ),
    signUpFallbackRedirectUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL ?? "/onboarding",
      origin,
    ),
    signInForceRedirectUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL ?? "/onboarding",
      origin,
    ),
    signUpForceRedirectUrl: ensureAbsoluteAppUrl(
      process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL ?? "/onboarding",
      origin,
    ),
    ssoCallbackUrl: ensureAbsoluteAppUrl("/sso-callback", origin),
    onboardingUrl: ensureAbsoluteAppUrl("/onboarding", origin),
  };
}
