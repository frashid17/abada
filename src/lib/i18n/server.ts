import { cookies } from "next/headers";
import { DEFAULT_LOCALE, type Locale } from "./types";

const LOCALE_COOKIE = "abada-locale";

export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : DEFAULT_LOCALE;
}
