"use client";

import { useSignIn } from "@clerk/nextjs";
import { getClerkOAuthRedirectUrl } from "@/lib/auth/app-url";
import { resolveAbsolutePostAuthRedirect } from "@/lib/auth/client-redirect";

type GoogleOAuthOptions = {
  redirectPath?: string | null;
};

/**
 * Google OAuth via signIn (not signUp) — creates new accounts automatically and
 * avoids Clerk's hosted accounts.dev/sign-up page for missing sign-up fields.
 */
export function useGoogleOAuthRedirect() {
  const { isLoaded, signIn } = useSignIn();

  async function redirectWithGoogle(options: GoogleOAuthOptions = {}): Promise<void> {
    if (!signIn) throw new Error("Sign-in not ready");

    await signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: getClerkOAuthRedirectUrl(),
      redirectUrlComplete: resolveAbsolutePostAuthRedirect(options.redirectPath),
    });
  }

  return {
    redirectWithGoogle,
    isReady: isLoaded && Boolean(signIn),
  };
}
