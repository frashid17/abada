"use client";

import { useUser } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Loader2, Lock, Mail, User } from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { getClerkErrorMessage } from "@/lib/auth/clerk-errors";
import type { UserContext } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function ManageAccountPanel() {
  const t = useTranslations("auth.manage");
  const { isLoaded, user } = useUser();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.firstName ?? "");
    setLastName(user.lastName ?? "");
  }, [user]);

  if (!isLoaded || !user) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const activeUser = user;

  const context =
    (activeUser.publicMetadata?.context as UserContext | undefined) ??
    (activeUser.unsafeMetadata?.context as UserContext | undefined) ??
    "founder";

  const email = activeUser.primaryEmailAddress?.emailAddress ?? "";

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfilePending(true);
    setError(null);
    setMessage(null);

    try {
      await activeUser.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      setMessage(t("profileSaved"));
    } catch (err) {
      setError(getClerkErrorMessage(err, t("profileError")));
    } finally {
      setProfilePending(false);
    }
  }

  async function handlePasswordSave(e: React.FormEvent) {
    e.preventDefault();
    setPasswordPending(true);
    setError(null);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      setPasswordPending(false);
      return;
    }

    try {
      await activeUser.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: false,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setMessage(t("passwordSaved"));
    } catch (err) {
      setError(getClerkErrorMessage(err, t("passwordError")));
    } finally {
      setPasswordPending(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card variant="elevated">
        <CardHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <User className="h-4 w-4" />
          </div>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <CardDescription>{t("profileDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <AuthField
                id="account-first-name"
                label={t("firstName")}
                value={firstName}
                onChange={setFirstName}
                disabled={profilePending}
                autoComplete="given-name"
              />
              <AuthField
                id="account-last-name"
                label={t("lastName")}
                value={lastName}
                onChange={setLastName}
                disabled={profilePending}
                autoComplete="family-name"
              />
            </div>
            <AuthField
              id="account-email"
              label={t("email")}
              type="email"
              value={email}
              onChange={() => {}}
              icon={Mail}
              disabled
            />
            <p className="text-xs text-muted-foreground">
              {t("contextLabel")}: <span className="font-medium">{t(`context.${context}`)}</span>
            </p>
            <Button type="submit" disabled={profilePending}>
              {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("saveProfile")}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Lock className="h-4 w-4" />
          </div>
          <CardTitle>{t("securityTitle")}</CardTitle>
          <CardDescription>{t("securityDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordSave} className="space-y-4">
            <AuthField
              id="current-password"
              label={t("currentPassword")}
              type="password"
              value={currentPassword}
              onChange={setCurrentPassword}
              disabled={passwordPending}
              required
              autoComplete="current-password"
            />
            <AuthField
              id="new-password"
              label={t("newPassword")}
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              disabled={passwordPending}
              required
              autoComplete="new-password"
            />
            <AuthField
              id="confirm-password"
              label={t("confirmPassword")}
              type="password"
              value={confirmPassword}
              onChange={setConfirmPassword}
              disabled={passwordPending}
              required
              autoComplete="new-password"
            />
            <Button type="submit" disabled={passwordPending}>
              {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("savePassword")}
            </Button>
          </form>
        </CardContent>
      </Card>

      {message ? <p className="text-sm text-muted-foreground lg:col-span-2">{message}</p> : null}
      {error ? <p className="text-sm text-destructive lg:col-span-2">{error}</p> : null}
    </div>
  );
}
