import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { sanitizeRedirectUrl } from "@/lib/auth/redirect";
import { getActiveSession, hasActiveAppSession } from "@/lib/auth/session";
import { getOnboardingRedirect } from "@/lib/onboarding/actions";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect_url?: string }>;
}) {
  const params = await searchParams;
  const redirectUrl = sanitizeRedirectUrl(params.redirect_url, "");

  if (await hasActiveAppSession()) {
    const { userId } = await getActiveSession();
    if (userId) {
      const destination = (await getOnboardingRedirect(userId)) ?? "/onboarding";
      redirect(redirectUrl || destination);
    }
  }

  return (
    <AuthShell>
      <SignInForm redirectUrl={redirectUrl || undefined} />
    </AuthShell>
  );
}
