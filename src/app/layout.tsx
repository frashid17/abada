import { Cormorant_Garamond, Geist_Mono, Plus_Jakarta_Sans } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import { ClerkProvider } from "@clerk/nextjs";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { getClerkAuthConfig } from "@/lib/auth/clerk-urls";
import { parseThemeSetting, serverHtmlDarkClass, THEME_COOKIE_KEY } from "@/lib/theme";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export async function generateMetadata() {
  const t = await getTranslations("meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();
  const clerk = getClerkAuthConfig();
  const cookieStore = await cookies();
  const storedTheme = parseThemeSetting(cookieStore.get(THEME_COOKIE_KEY)?.value) ?? "system";

  return (
    <html lang={locale} className={serverHtmlDarkClass(storedTheme)} suppressHydrationWarning>
      <body
        className={`${jakarta.variable} ${geistMono.variable} ${cormorant.variable} font-sans antialiased`}
      >
        <ClerkProvider
          signInUrl={clerk.signInUrl}
          signUpUrl={clerk.signUpUrl}
          signInFallbackRedirectUrl={clerk.signInFallbackRedirectUrl}
          signUpFallbackRedirectUrl={clerk.signUpFallbackRedirectUrl}
          signInForceRedirectUrl={clerk.signInForceRedirectUrl}
          signUpForceRedirectUrl={clerk.signUpForceRedirectUrl}
        >
          <ThemeProvider defaultTheme={storedTheme}>
            <NextIntlClientProvider locale={locale} messages={messages}>
              {children}
            </NextIntlClientProvider>
          </ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
