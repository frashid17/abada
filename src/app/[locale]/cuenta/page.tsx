import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ManageAccountPanel } from "@/components/auth/manage-account-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getOrCreateProfile } from "@/lib/auth/profile";
import type { UserContext } from "@/types/database";

function shellForContext(context: UserContext): "founder" | "investor" | "firm" | "public" {
  if (context === "founder") return "founder";
  if (context === "investor") return "investor";
  if (context === "firm") return "firm";
  return "public";
}

export default async function ManageAccountPage() {
  const { userId } = await auth();
  if (!userId) redirect("/iniciar-sesion?redirect_url=/cuenta");

  const profile = await getOrCreateProfile();
  const variant = profile ? shellForContext(profile.context as UserContext) : "public";
  const t = await getTranslations("auth.manage");

  return (
    <AppShell variant={variant}>
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
        <ManageAccountPanel />
      </div>
    </AppShell>
  );
}
