import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { FounderTemplatesPage } from "@/components/founder/founder-templates-page";
import { getOrCreateProfile } from "@/lib/auth/profile";

export default async function FounderTemplatesRoute({
  params,
}: {
  params: Promise<{ docType: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/fundador/plantillas/term-sheet");

  const profile = await getOrCreateProfile();
  if (profile?.context !== "founder") redirect("/");

  return (
    <AppShell variant="founder">
      <FounderTemplatesPage params={params} />
    </AppShell>
  );
}
