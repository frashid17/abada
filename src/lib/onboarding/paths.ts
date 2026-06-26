export function buildOnboardingPath(inviteToken?: string): string {
  if (!inviteToken) return "/onboarding";
  return `/onboarding?invite=${encodeURIComponent(inviteToken)}`;
}
