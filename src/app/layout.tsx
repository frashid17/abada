import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { SiteHeader } from "@/components/layout/site-header";
import { I18nProvider } from "@/lib/i18n/provider";
import { getServerLocale } from "@/lib/i18n/server";
import { t } from "@/lib/i18n";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t(locale, "meta.title"),
    description: t(locale, "meta.description"),
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getServerLocale();

  return (
    <html
      lang={locale === "en" ? "en" : "es-CO"}
      className={`${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <I18nProvider initialLocale={locale}>
          <SiteHeader />
          <main className="flex-1">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
