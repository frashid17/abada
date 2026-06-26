import { getTranslations } from "next-intl/server";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { FirmInviteForm } from "@/components/firm/firm-invite-form";
import { FirmMemberList } from "@/components/firm/firm-member-list";
import { listFirmMembers, listPendingFirmInvitations } from "@/lib/firm/invitations";
import { isFirmAdminRole } from "@/lib/firm/membership";
import { requireFirmPageAccess } from "@/lib/firm/session";
import { Card, CardContent } from "@/components/ui/card";

export default async function FirmTeamPage() {
  const session = await requireFirmPageAccess("/firma/equipo");
  const t = await getTranslations("firm.team");

  const canManageRoles = isFirmAdminRole(session.role as "admin");

  const [members, invitations] = await Promise.all([
    listFirmMembers(session.tenantId),
    canManageRoles ? listPendingFirmInvitations(session.tenantId) : Promise.resolve([]),
  ]);

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader eyebrow={t("eyebrow")} title={t("title")} description={t("subtitle")} />

        {canManageRoles ? <FirmInviteForm /> : null}

        <section className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{t("membersTitle")}</h2>
          <FirmMemberList
            members={members}
            canManageRoles={canManageRoles}
            currentUserId={session.userId}
          />
        </section>

        {invitations.length > 0 ? (
          <section className="space-y-4">
            <h2 className="font-serif text-xl font-semibold">{t("pendingTitle")}</h2>
            <div className="space-y-3">
              {invitations.map((invite) => (
                <Card key={invite.id} variant="elevated">
                  <CardContent className="space-y-2 p-4">
                    <p className="text-sm font-medium">{invite.email}</p>
                    <p className="text-xs text-muted-foreground">{t(`roles.${invite.role}`)}</p>
                    <p className="break-all font-mono text-[10px] text-muted-foreground">
                      {invite.inviteUrl}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
