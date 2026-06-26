"use client";

import { useAuth, useClerk, useSignIn } from "@clerk/nextjs";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { AtSign, Eye, EyeOff, Loader2, Lock } from "lucide-react";
import { AuthDivider } from "@/components/auth/auth-divider";
import { AuthField } from "@/components/auth/auth-field";
import { GoogleIcon } from "@/components/auth/auth-icons";
import { resetClerkClientSession } from "@/lib/auth/clear-session";
import { redirectAfterAuth } from "@/lib/auth/client-redirect";
import { getClerkErrorMessage, isClerkAlreadySignedInError } from "@/lib/auth/clerk-errors";
import { useGoogleOAuthRedirect } from "@/lib/auth/use-google-oauth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SignInFormProps = {
  redirectUrl?: string;
};

type SignInStep = "credentials" | "forgot_request" | "forgot_verify";

export function SignInForm({ redirectUrl }: SignInFormProps) {
  const t = useTranslations("auth.signIn");
  const { isLoaded: authLoaded } = useAuth();
  const { signOut } = useClerk();
  const { isLoaded, signIn, setActive } = useSignIn();
  const { redirectWithGoogle, isReady: googleReady } = useGoogleOAuthRedirect();

  const [step, setStep] = useState<SignInStep>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authLoaded || !isLoaded || !signIn || !setActive || !googleReady) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const signInClient = signIn;
  const setActiveSession = setActive;

  function redirectToApp() {
    redirectAfterAuth(redirectUrl);
  }

  async function handleAlreadySignedIn() {
    await resetClerkClientSession(signOut, { reload: true });
  }

  async function finishSignIn(sessionId: string) {
    await setActiveSession({ session: sessionId });
    redirectToApp();
  }

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signInClient.create({ identifier: email, password });

      if (result.status === "complete" && result.createdSessionId) {
        await finishSignIn(result.createdSessionId);
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

  async function handleForgotRequest(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      await signInClient.create({
        strategy: "reset_password_email_code",
        identifier: email,
      });
      setStep("forgot_verify");
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

  async function handleForgotVerify(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const result = await signInClient.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code,
        password: newPassword,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await finishSignIn(result.createdSessionId);
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
      await redirectWithGoogle({ redirectPath: redirectUrl });
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
      <CardHeader>
        <CardTitle className="text-2xl">{t("title")}</CardTitle>
        <CardDescription>{t("subtitle")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        {step === "credentials" ? (
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

            <form onSubmit={handleCredentials} className="space-y-4">
              <AuthField
                id="sign-in-email"
                label={t("email")}
                type="email"
                value={email}
                onChange={setEmail}
                placeholder={t("emailPlaceholder")}
                icon={AtSign}
                disabled={pending}
                required
                autoComplete="email"
              />
              <AuthField
                id="sign-in-password"
                label={t("password")}
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={setPassword}
                placeholder={t("passwordPlaceholder")}
                icon={Lock}
                disabled={pending}
                required
                autoComplete="current-password"
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

              <div className="flex justify-end">
                <button
                  type="button"
                  className="text-sm font-medium text-primary hover:underline"
                  onClick={() => {
                    setStep("forgot_request");
                    setError(null);
                  }}
                >
                  {t("forgotPassword")}
                </button>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("submit")}
              </Button>
            </form>
          </>
        ) : null}

        {step === "forgot_request" ? (
          <form onSubmit={handleForgotRequest} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("forgotDescription")}</p>
            <AuthField
              id="forgot-email"
              label={t("email")}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder={t("emailPlaceholder")}
              icon={AtSign}
              disabled={pending}
              required
              autoComplete="email"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                disabled={pending}
                onClick={() => setStep("credentials")}
              >
                {t("back")}
              </Button>
              <Button type="submit" variant="cta" className="flex-1" disabled={pending}>
                {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {t("sendReset")}
              </Button>
            </div>
          </form>
        ) : null}

        {step === "forgot_verify" ? (
          <form onSubmit={handleForgotVerify} className="space-y-4">
            <p className="text-sm text-muted-foreground">{t("resetDescription")}</p>
            <AuthField
              id="reset-code"
              label={t("verificationCode")}
              value={code}
              onChange={setCode}
              placeholder={t("verificationPlaceholder")}
              disabled={pending}
              required
              autoComplete="one-time-code"
            />
            <AuthField
              id="reset-password"
              label={t("newPassword")}
              type="password"
              value={newPassword}
              onChange={setNewPassword}
              placeholder={t("newPasswordPlaceholder")}
              icon={Lock}
              disabled={pending}
              required
              autoComplete="new-password"
            />
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            <Button type="submit" variant="cta" size="lg" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {t("resetSubmit")}
            </Button>
          </form>
        ) : null}

        <p className="text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <a href="/registro" className="font-medium text-primary hover:underline">
            {t("createAccount")}
          </a>
        </p>
      </CardContent>
    </Card>
  );
}
