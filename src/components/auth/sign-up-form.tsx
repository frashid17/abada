"use client";

import { useAuth, useClerk, useSignUp } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";
import { AtSign, Eye, EyeOff, Loader2, Lock, User } from "lucide-react";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleIcon } from "@/components/auth/auth-icons";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import { resetClerkClientSession } from "@/lib/auth/clear-session";
import { redirectAfterAuth } from "@/lib/auth/client-redirect";
import { getClerkErrorMessage, isClerkAlreadySignedInError } from "@/lib/auth/clerk-errors";
import { isPasswordValid } from "@/lib/auth/password-policy";
import { PREFERRED_CONTEXT_COOKIE } from "@/lib/auth/preferred-context-cookie-name";
import { useGoogleOAuthRedirect } from "@/lib/auth/use-google-oauth";
import { buildOnboardingPath } from "@/lib/onboarding/paths";
import type { UserContext } from "@/types/database";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SignUpFormProps = {
  redirectUrl?: string;
  inviteToken?: string;
  inviteEmail?: string;
  preferredContext?: UserContext;
};

function rememberPreferredContext(context: UserContext | undefined) {
  if (!context || typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${PREFERRED_CONTEXT_COOKIE}=${context}; Path=/; Max-Age=600; SameSite=Lax${secure}`;
}

export function SignUpForm({
  redirectUrl,
  inviteToken,
  inviteEmail,
  preferredContext,
}: SignUpFormProps) {
  const t = useTranslations("auth.signUp");
  const { isLoaded: authLoaded } = useAuth();
  const { signOut } = useClerk();
  const { isLoaded, signUp, setActive } = useSignUp();
  const { redirectWithGoogle, isReady: googleReady } = useGoogleOAuthRedirect();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(inviteEmail ?? "");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const postAuthPath = redirectUrl ?? buildOnboardingPath(inviteToken);

  const metadata: Record<string, string> = {};
  if (inviteToken) metadata.inviteToken = inviteToken;
  if (preferredContext) metadata.context = preferredContext;

  if (!authLoaded || !isLoaded || !signUp || !setActive || !googleReady) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const signUpClient = signUp;
  const setActiveSession = setActive;
  const titleKey = preferredContext ?? "default";
  const subtitleKey = inviteToken
    ? "invite"
    : preferredContext
      ? preferredContext
      : "default";

  async function handleAlreadySignedIn() {
    await resetClerkClientSession(signOut, { reload: true });
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError(t("requiredFields"));
      setPending(false);
      return;
    }

    if (!isPasswordValid(password)) {
      setError(t("passwordRules.incomplete"));
      setPending(false);
      return;
    }

    try {
      rememberPreferredContext(preferredContext);
      await signUpClient.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        unsafeMetadata: metadata,
      });

      await signUpClient.prepareEmailAddressVerification({ strategy: "email_code" });
      setPendingVerification(true);
    } catch (err) {
      if (isClerkAlreadySignedInError(err)) {
        await handleAlreadySignedIn();
        return;
      }
      setError(getClerkErrorMessage(err, t("error")));
    } finally {
      setPending(false);
    }
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signUpClient.attemptEmailAddressVerification({ code });

      if (result.status === "complete" && result.createdSessionId) {
        await setActiveSession({ session: result.createdSessionId });
        redirectAfterAuth(postAuthPath, preferredContext);
        return;
      }

      setError(t("additionalStepRequired"));
    } catch (err) {
      if (isClerkAlreadySignedInError(err)) {
        await handleAlreadySignedIn();
        return;
      }
      setError(getClerkErrorMessage(err, t("error")));
    } finally {
      setPending(false);
    }
  }

  async function handleGoogle() {
    setPending(true);
    setError(null);

    try {
      rememberPreferredContext(preferredContext);
      await redirectWithGoogle({ redirectPath: postAuthPath });
    } catch (err) {
      if (isClerkAlreadySignedInError(err)) {
        await handleAlreadySignedIn();
        return;
      }
      setError(getClerkErrorMessage(err, t("error")));
    } finally {
      setPending(false);
    }
  }

  return (
    <Card variant="elevated" className="border-border/80 shadow-card">
      <CardHeader className="space-y-4">
        <div>
          <CardTitle className="text-2xl">{t(`title.${titleKey}`)}</CardTitle>
          <CardDescription>{t(`subtitle.${subtitleKey}`)}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!pendingVerification ? (
          <>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              disabled={pending}
              onClick={handleGoogle}
            >
              <GoogleIcon className="h-4 w-4" />
              {t("google")}
            </Button>

            <AuthDivider />

            <form onSubmit={handleSignUp} className="space-y-4">
              <AuthField
                id="sign-up-email"
                label={t("email")}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t("emailPlaceholder")}
                icon={AtSign}
                disabled={pending || Boolean(inviteEmail)}
                required
                autoComplete="email"
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <AuthField
                  id="sign-up-first-name"
                  label={t("firstName")}
                  value={firstName}
                  onChange={setFirstName}
                  placeholder={t("firstNamePlaceholder")}
                  icon={User}
                  disabled={pending}
                  required
                  autoComplete="given-name"
                />
                <AuthField
                  id="sign-up-last-name"
                  label={t("lastName")}
                  value={lastName}
                  onChange={setLastName}
                  placeholder={t("lastNamePlaceholder")}
                  disabled={pending}
                  required
                  autoComplete="family-name"
                />
              </div>
              <AuthField
                id="sign-up-password"
                label={t("password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder={t("passwordPlaceholder")}
                icon={Lock}
                disabled={pending}
                required
                minLength={8}
                autoComplete="new-password"
                trailing={
                  <button
                    type="button"
                    className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                }
              />
              <PasswordRequirements password={password} />

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button
                type="submit"
                variant="cta"
                size="lg"
                className="w-full"
                disabled={
                  pending ||
                  !isPasswordValid(password) ||
                  !email.trim() ||
                  !firstName.trim() ||
                  !lastName.trim()
                }
              >
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("submit")}
              </Button>
            </form>
          </>
        ) : (
          <form onSubmit={handleVerify} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("verifyDescription")}</p>
            <AuthField
              id="sign-up-code"
              label={t("verificationCode")}
              value={code}
              onChange={setCode}
              placeholder={t("verificationPlaceholder")}
              disabled={pending}
              required
              autoComplete="one-time-code"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("verifySubmit")}
            </Button>
          </form>
        )}

        <p className="text-center text-sm text-muted-foreground">
          {t("hasAccount")}{" "}
          <Link href="/iniciar-sesion" className="font-medium text-primary hover:underline">
            {t("signIn")}
          </Link>
        </p>

        <p className="text-center text-[11px] leading-relaxed text-muted-foreground">{t("terms")}</p>
      </CardContent>
    </Card>
  );
}
