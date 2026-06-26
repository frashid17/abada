"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { defaultLocale, isAppLocale, type AppLocale } from "@/i18n/config";

export async function setLocaleCookie(locale: AppLocale): Promise<void> {
  if (!isAppLocale(locale)) return;

  const cookieStore = await cookies();
  cookieStore.set("locale", locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}

export async function getLocaleCookie(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const value = cookieStore.get("locale")?.value;
  return value && isAppLocale(value) ? value : defaultLocale;
}
