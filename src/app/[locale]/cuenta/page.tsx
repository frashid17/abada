import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { ManageAccountPanel } from "@/components/auth/manage-account-panel";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { getOrCreateProfile } from "@/lib/auth/profile";
import { getFirmMembershipForUser } from "@/lib/firm/membership";
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
  const context = (profile?.context as UserContext | undefined) ?? "founder";
  const variant = shellForContext(context);
  const membership = await getFirmMembershipForUser(userId);
  const t = await getTranslations("auth.manage");

  return (
    <AppShell variant={variant}>
      <div className="relative space-y-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-4 -top-6 h-56 rounded-[2rem] bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--primary)_12%,transparent),transparent_70%)] sm:-inset-x-8"
        />
        <div className="relative space-y-8">
          <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />
          <ManageAccountPanel
            hasFirmMembership={Boolean(membership)}
            initialContext={context}
          />
        </div>
      </div>
    </AppShell>
  );
}
