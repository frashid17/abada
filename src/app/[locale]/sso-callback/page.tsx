import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";
import { getClerkAuthConfig } from "@/lib/auth/clerk-urls";

export default function SsoCallbackPage() {
  const clerk = getClerkAuthConfig();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <AuthenticateWithRedirectCallback
        signInUrl={clerk.signInUrl}
        signUpUrl={clerk.signUpUrl}
        signInFallbackRedirectUrl={clerk.onboardingUrl}
        signUpFallbackRedirectUrl={clerk.onboardingUrl}
        signInForceRedirectUrl={clerk.signInForceRedirectUrl}
        signUpForceRedirectUrl={clerk.signUpForceRedirectUrl}
      />
    </div>
  );
}
