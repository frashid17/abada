import { getOrCreateProfile } from "@/lib/auth/profile";

export type AppShellVariant = "public" | "founder" | "investor" | "firm";

export async function resolveAppShellVariant(): Promise<AppShellVariant> {
  const profile = await getOrCreateProfile();
  if (profile?.context === "founder") return "founder";
  if (profile?.context === "investor") return "investor";
  if (profile?.context === "firm") return "firm";
  return "public";
}
