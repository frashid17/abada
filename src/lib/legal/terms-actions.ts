"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import {
  CURRENT_TERMS_VERSION,
  hasAcceptedCurrentTerms,
  recordTermsAcceptance,
  type TermsLocale,
} from "@/lib/legal/terms";

export type AcceptTermsResult =
  | { ok: true; termsVersion: string }
  | { ok: false; error: "unauthorized" | "invalid_locale" | "generic" };

export async function hasAcceptedTermsAction(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;
  return hasAcceptedCurrentTerms(userId);
}

export async function acceptTermsAction(input: {
  locale: string;
  accepted: boolean;
}): Promise<AcceptTermsResult> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "unauthorized" };
  if (!input.accepted) return { ok: false, error: "generic" };

  const locale: TermsLocale = input.locale === "en-US" ? "en-US" : "es-CO";
  if (input.locale !== "es-CO" && input.locale !== "en-US") {
    return { ok: false, error: "invalid_locale" };
  }

  const user = await currentUser();
  const email =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses?.[0]?.emailAddress ??
    null;
  if (!email) return { ok: false, error: "unauthorized" };

  const name =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.fullName ||
    null;

  try {
    await recordTermsAcceptance({
      ownerSub: userId,
      locale,
      respondentEmail: email,
      respondentName: name,
    });
    revalidatePath("/fundador", "layout");
    return { ok: true, termsVersion: CURRENT_TERMS_VERSION };
  } catch (error) {
    console.error("[terms] acceptTermsAction", error);
    return { ok: false, error: "generic" };
  }
}
