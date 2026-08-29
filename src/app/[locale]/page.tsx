import { AppShell } from "@/components/layout/app-shell";
import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingDisclosure } from "@/components/marketing/landing-disclosure";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingModules } from "@/components/marketing/landing-modules";
import { LandingPipeline } from "@/components/marketing/landing-pipeline";
import { LandingStats } from "@/components/marketing/landing-stats";
import { getActiveSession } from "@/lib/auth/session";

export default async function HomePage() {
  // Turbopack cold starts can briefly miss clerkMiddleware headers; fall through to
  // the public landing instead of crashing the first GET /.
  let userId: string | null = null;
  try {
    ({ userId } = await getActiveSession());
  } catch {
    userId = null;
  }

  const isSignedIn = Boolean(userId);

  return (
    <AppShell variant="public">
      <div className="space-y-20">
        <LandingHero isSignedIn={isSignedIn} />
        <LandingStats />
        <LandingPipeline />
        <LandingModules />
        <LandingCta isSignedIn={isSignedIn} />
        <LandingDisclosure />
      </div>
    </AppShell>
  );
}
