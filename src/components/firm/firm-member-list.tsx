"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { updateFirmMemberRoleAction } from "@/lib/firm/actions";
import type { FirmMember } from "@/lib/firm/invitations";
import type { FirmMemberRole } from "@/lib/firm/membership";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const ROLES: FirmMemberRole[] = ["admin", "partner", "associate", "of_counsel"];

type FirmMemberListProps = {
  members: FirmMember[];
  canManageRoles: boolean;
  currentUserId: string;
};

export function FirmMemberList({ members, canManageRoles, currentUserId }: FirmMemberListProps) {
  return (
    <div className="grid gap-3">
      {members.map((member) => (
        <FirmMemberCard
          key={member.id}
          member={member}
          canManageRoles={canManageRoles}
          isSelf={member.clerkUserId === currentUserId}
        />
      ))}
    </div>
  );
}

type FirmMemberCardProps = {
  member: FirmMember;
  canManageRoles: boolean;
  isSelf: boolean;
};

function FirmMemberCard({ member, canManageRoles, isSelf }: FirmMemberCardProps) {
  const t = useTranslations("firm.team");
  const [role, setRole] = useState<FirmMemberRole>(member.role);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const displayName = member.displayName ?? member.email ?? member.clerkUserId;
  const roleChanged = role !== member.role;

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      const result = await updateFirmMemberRoleAction({
        membershipId: member.id,
        role,
      });

      if (result.ok) {
        setMessage(t("roleUpdated"));
        return;
      }

      const errorKey = result.error as
        | "last_admin"
        | "member_not_found"
        | "invalid_role"
        | "forbidden"
        | "unauthorized"
        | "role_update_failed";
      setMessage(t(`errors.${errorKey}` as "errors.role_update_failed"));
    });
  }

  return (
    <Card variant="elevated">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">
          {displayName}
          {isSelf ? (
            <span className="ml-2 text-xs font-normal text-muted-foreground">({t("you")})</span>
          ) : null}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 pt-0">
        {member.email ? (
          <p className="text-xs text-muted-foreground">{member.email}</p>
        ) : null}

        {canManageRoles ? (
          <div className="flex flex-wrap items-end gap-3">
            <div className="space-y-2">
              <Label htmlFor={`member-role-${member.id}`}>{t("roleLabel")}</Label>
              <Select
                id={`member-role-${member.id}`}
                value={role}
                disabled={pending}
                onChange={(e) => setRole(e.target.value as FirmMemberRole)}
              >
                {ROLES.map((option) => (
                  <option key={option} value={option}>
                    {t(`roles.${option}`)}
                  </option>
                ))}
              </Select>
            </div>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pending || !roleChanged}
              onClick={handleSave}
            >
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {t("saveRole")}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">{t(`roles.${member.role}`)}</p>
        )}

        {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
      </CardContent>
    </Card>
  );
}
