"use client";

import { useUser } from "@clerk/nextjs";
import type { UserResource } from "@clerk/types";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { useRouter as useNextRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Building2,
  Check,
  Globe,
  Loader2,
  Lock,
  Monitor,
  Moon,
  Rocket,
  Shield,
  Sun,
  User,
  Users,
} from "lucide-react";
import { AuthField } from "@/components/auth/auth-field";
import { useTheme } from "@/components/providers/theme-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { locales, type AppLocale } from "@/i18n/config";
import {
  syncOwnProfileAction,
  updateOwnWorkspaceContextAction,
} from "@/lib/auth/account-actions";
import { getClerkErrorMessage } from "@/lib/auth/clerk-errors";
import { homeForContext } from "@/lib/auth/routing";
import { setLocaleCookie } from "@/lib/i18n/actions";
import { completeCreateFirmOnboarding } from "@/lib/onboarding/actions";
import type { ThemeSetting } from "@/lib/theme";
import { cn } from "@/lib/utils";
import type { UserContext } from "@/types/database";

type ManageAccountPanelProps = {
  hasFirmMembership: boolean;
  initialContext: UserContext;
};

const WORKSPACES: {
  id: UserContext;
  icon: typeof Rocket;
}[] = [
  { id: "founder", icon: Rocket },
  { id: "investor", icon: Users },
  { id: "firm", icon: Building2 },
];

const THEME_OPTIONS: { id: ThemeSetting; icon: typeof Sun }[] = [
  { id: "light", icon: Sun },
  { id: "dark", icon: Moon },
  { id: "system", icon: Monitor },
];

const LOCALE_LABELS: Record<AppLocale, string> = {
  "es-CO": "Español (CO)",
  "en-US": "English (US)",
};

export function ManageAccountPanel({
  hasFirmMembership,
  initialContext,
}: ManageAccountPanelProps) {
  const { isLoaded, user } = useUser();

  if (!isLoaded || !user) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <ManageAccountPanelContent
      user={user}
      hasFirmMembership={hasFirmMembership}
      initialContext={initialContext}
    />
  );
}

function ManageAccountPanelContent({
  user,
  hasFirmMembership,
  initialContext,
}: {
  user: UserResource;
  hasFirmMembership: boolean;
  initialContext: UserContext;
}) {
  const t = useTranslations("auth.manage");
  const locale = useLocale() as AppLocale;
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const nextRouter = useNextRouter();
  const pathname = usePathname();

  const contextFromClerk =
    (user.publicMetadata?.context as UserContext | undefined) ??
    (user.unsafeMetadata?.context as UserContext | undefined) ??
    initialContext;

  const [firstName, setFirstName] = useState(user.firstName ?? "");
  const [lastName, setLastName] = useState(user.lastName ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [signOutOthers, setSignOutOthers] = useState(false);
  const [firmName, setFirmName] = useState("");
  const [showFirmSetup, setShowFirmSetup] = useState(false);
  const [activeContext, setActiveContext] = useState<UserContext>(contextFromClerk);
  const [profilePending, setProfilePending] = useState(false);
  const [passwordPending, setPasswordPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contextPending, startContextTransition] = useTransition();
  const [prefsPending, startPrefsTransition] = useTransition();

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  const fullName =
    [firstName.trim(), lastName.trim()].filter(Boolean).join(" ") ||
    user.fullName ||
    t("unnamed");

  function clearFeedback() {
    setError(null);
    setMessage(null);
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfilePending(true);
    clearFeedback();

    try {
      await user.update({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });
      await syncOwnProfileAction();
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
    clearFeedback();

    if (newPassword !== confirmPassword) {
      setError(t("passwordMismatch"));
      setPasswordPending(false);
      return;
    }

    try {
      await user.updatePassword({
        currentPassword,
        newPassword,
        signOutOfOtherSessions: signOutOthers,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSignOutOthers(false);
      setMessage(t("passwordSaved"));
    } catch (err) {
      setError(getClerkErrorMessage(err, t("passwordError")));
    } finally {
      setPasswordPending(false);
    }
  }

  function handleWorkspaceSelect(next: UserContext) {
    if (next === activeContext || contextPending) return;
    clearFeedback();

    if (next === "firm" && !hasFirmMembership) {
      setShowFirmSetup(true);
      return;
    }

    setShowFirmSetup(false);
    startContextTransition(async () => {
      const result = await updateOwnWorkspaceContextAction(next);
      if (!result.ok) {
        if (result.error === "firm_setup_required") {
          setShowFirmSetup(true);
          return;
        }
        setError(t(`contextErrors.${result.error}`));
        return;
      }
      setActiveContext(next);
      setMessage(t("contextSaved"));
      window.location.assign(result.redirect);
    });
  }

  function handleCreateFirm(e: React.FormEvent) {
    e.preventDefault();
    clearFeedback();
    startContextTransition(async () => {
      const result = await completeCreateFirmOnboarding({ firmName });
      if (!result.ok) {
        setError(t("firmCreateError"));
        return;
      }
      setActiveContext("firm");
      window.location.assign(result.redirect);
    });
  }

  function handleLocaleChange(nextLocale: AppLocale) {
    if (nextLocale === locale || prefsPending) return;
    const query = typeof window !== "undefined" ? window.location.search : "";
    const href = query ? `${pathname}${query}` : pathname;

    startPrefsTransition(async () => {
      await setLocaleCookie(nextLocale);
      router.replace(href, { locale: nextLocale });
      nextRouter.refresh();
      setMessage(t("prefsSaved"));
    });
  }

  return (
    <div className="space-y-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border/70 bg-surface-elevated shadow-card">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_18%,transparent),transparent_55%),radial-gradient(ellipse_at_bottom_left,color-mix(in_oklab,var(--highlight)_14%,transparent),transparent_50%)]"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-border/80 bg-primary/10 shadow-soft">
            {user.imageUrl ? (
              <Image
                src={user.imageUrl}
                alt=""
                fill
                sizes="80px"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-primary">
                <User className="h-8 w-8" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-highlight">
              {t("eyebrow")}
            </p>
            <h2 className="truncate font-serif text-2xl font-semibold tracking-tight sm:text-3xl">
              {fullName}
            </h2>
            <p className="truncate text-sm text-muted-foreground">{email}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
                <Shield className="h-3.5 w-3.5" />
                {t(`context.${activeContext}`)}
              </span>
              <Link
                href={homeForContext(activeContext)}
                className="text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {t("goToWorkspace")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {(message || error) && (
        <div
          className={cn(
            "rounded-xl border px-4 py-3 text-sm",
            error
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-primary/20 bg-primary/5 text-foreground",
          )}
          role="status"
        >
          {error ?? message}
        </div>
      )}

      {/* Workspace role */}
      <Card variant="panel" className="overflow-hidden">
        <CardHeader>
          <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Shield className="h-4 w-4" />
          </div>
          <CardTitle>{t("workspaceTitle")}</CardTitle>
          <CardDescription>{t("workspaceDescription")}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {WORKSPACES.map(({ id, icon: Icon }) => {
              const selected = activeContext === id;
              return (
                <button
                  key={id}
                  type="button"
                  disabled={contextPending}
                  onClick={() => handleWorkspaceSelect(id)}
                  className={cn(
                    "group relative rounded-2xl border p-4 text-left transition-all duration-200",
                    selected
                      ? "border-primary/40 bg-primary/5 shadow-soft ring-1 ring-primary/25"
                      : "border-border/80 bg-card hover:border-primary/30 hover:shadow-card",
                    contextPending && "opacity-70",
                  )}
                >
                  {selected ? (
                    <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="h-3 w-3" />
                    </span>
                  ) : null}
                  <div
                    className={cn(
                      "mb-3 flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-primary/10 text-primary group-hover:bg-primary/15",
                    )}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <p className="font-serif text-base font-semibold">{t(`context.${id}`)}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                    {t(`workspaceHints.${id}`)}
                  </p>
                </button>
              );
            })}
          </div>

          {showFirmSetup ? (
            <div className="rounded-2xl border border-border/80 bg-muted/30 p-4 sm:p-5">
              <p className="text-sm font-medium text-foreground">{t("firmSetupTitle")}</p>
              <p className="mt-1 text-sm text-muted-foreground">{t("firmSetupDescription")}</p>
              <form onSubmit={handleCreateFirm} className="mt-4 space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="account-firm-name">{t("firmName")}</Label>
                  <Input
                    id="account-firm-name"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    placeholder={t("firmNamePlaceholder")}
                    disabled={contextPending}
                    required
                    minLength={2}
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button type="submit" variant="cta" disabled={contextPending || firmName.trim().length < 2}>
                    {contextPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                    {t("createFirm")}
                  </Button>
                  <Button type="button" variant="outline" asChild>
                    <Link href="/invitacion-firma">{t("haveInvite")}</Link>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    disabled={contextPending}
                    onClick={() => setShowFirmSetup(false)}
                  >
                    {t("cancelFirmSetup")}
                  </Button>
                </div>
              </form>
            </div>
          ) : null}

          {contextPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {t("contextUpdating")}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
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
                disabled
              />
              <p className="text-xs text-muted-foreground">{t("emailHint")}</p>
              <Button type="submit" disabled={profilePending}>
                {profilePending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("saveProfile")}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card variant="elevated">
          <CardHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Globe className="h-4 w-4" />
            </div>
            <CardTitle>{t("prefsTitle")}</CardTitle>
            <CardDescription>{t("prefsDescription")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">{t("languageLabel")}</p>
              <div className="grid grid-cols-2 gap-2">
                {locales.map((loc) => {
                  const selected = locale === loc;
                  return (
                    <button
                      key={loc}
                      type="button"
                      disabled={prefsPending}
                      onClick={() => handleLocaleChange(loc)}
                      className={cn(
                        "rounded-xl border px-3 py-2.5 text-left text-sm transition-all",
                        selected
                          ? "border-primary/40 bg-primary/5 font-medium text-foreground ring-1 ring-primary/20"
                          : "border-border/80 bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground",
                      )}
                    >
                      {LOCALE_LABELS[loc]}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm font-medium">{t("themeLabel")}</p>
              <div className="grid grid-cols-3 gap-2">
                {THEME_OPTIONS.map(({ id, icon: Icon }) => {
                  const selected = theme === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => {
                        setTheme(id);
                        setMessage(t("prefsSaved"));
                      }}
                      className={cn(
                        "flex flex-col items-center gap-2 rounded-xl border px-2 py-3 text-xs transition-all",
                        selected
                          ? "border-primary/40 bg-primary/5 font-medium text-foreground ring-1 ring-primary/20"
                          : "border-border/80 bg-card text-muted-foreground hover:border-primary/25 hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(`themeOptions.${id}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardHeader>
            <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Lock className="h-4 w-4" />
            </div>
            <CardTitle>{t("securityTitle")}</CardTitle>
            <CardDescription>{t("securityDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSave} className="grid gap-4 md:grid-cols-2">
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
              <div className="hidden md:block" />
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
              <label className="flex items-start gap-3 rounded-xl border border-border/70 bg-muted/20 px-3 py-3 text-sm md:col-span-2">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 rounded border-border"
                  checked={signOutOthers}
                  onChange={(e) => setSignOutOthers(e.target.checked)}
                  disabled={passwordPending}
                />
                <span>
                  <span className="font-medium text-foreground">{t("signOutOthers")}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    {t("signOutOthersHint")}
                  </span>
                </span>
              </label>
              <div className="md:col-span-2">
                <Button type="submit" disabled={passwordPending}>
                  {passwordPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {t("savePassword")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
