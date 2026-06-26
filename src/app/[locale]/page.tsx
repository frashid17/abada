import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { LandingCompliance } from "@/components/marketing/landing-compliance";
import { LandingCta } from "@/components/marketing/landing-cta";
import { LandingDisclosure } from "@/components/marketing/landing-disclosure";
import { LandingHero } from "@/components/marketing/landing-hero";
import { LandingModules } from "@/components/marketing/landing-modules";
import { LandingPipeline } from "@/components/marketing/landing-pipeline";
import { LandingStats } from "@/components/marketing/landing-stats";
import { getActiveSession } from "@/lib/auth/session";
import { getOnboardingRedirect } from "@/lib/onboarding/actions";

export default async function HomePage() {
  const { userId } = await getActiveSession();

  if (userId) {
    const destination = await getOnboardingRedirect(userId);
    redirect(destination ?? "/onboarding");
  }

  return (
    <AppShell variant="public">
      <div className="space-y-20">
        <LandingHero isSignedIn={false} />
        <LandingCompliance />
        <LandingStats />
        <LandingPipeline />
        <LandingModules />
        <LandingCta />
        <LandingDisclosure />
      </div>
    </AppShell>
  );
}
