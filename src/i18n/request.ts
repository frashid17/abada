import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { applyUiCopyOverrides, type MessagesTree } from "@/lib/platform-admin/ui-copy";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  const catalog = (await import(`../messages/${locale}.json`)).default as MessagesTree;
  const messages = await applyUiCopyOverrides(locale, catalog);

  return {
    locale,
    messages,
  };
});
