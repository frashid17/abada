import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand/brand-mark";
import { Link } from "@/i18n/navigation";
import { getBrandName, getFirmName } from "@/lib/brand";

const platformLinks = [
  { href: "/registro", key: "founders" },
  { href: "/registro", key: "investors" },
  { href: "/iniciar-sesion?redirect_url=/firma", key: "firm" },
] as const;

const accountLinks = [
  { href: "/iniciar-sesion", key: "signIn" },
  { href: "/registro", key: "signUp" },
] as const;

export async function SiteFooter() {
  const t = await getTranslations("footer");
  const brand = getBrandName();
  const firm = getFirmName();
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 mt-auto shrink-0 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href="/" className="inline-block cursor-pointer transition-opacity hover:opacity-90">
              <BrandMark wordmark={brand} />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">{t("tagline")}</p>
            <p className="text-xs text-muted-foreground">{t("firmNote", { firm })}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("platform")}
            </p>
            <ul className="mt-4 space-y-2.5">
              {platformLinks.map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="cursor-pointer text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t(`platformLinks.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {t("account")}
            </p>
            <ul className="mt-4 space-y-2.5">
              {accountLinks.map(({ href, key }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="cursor-pointer text-sm text-foreground/80 transition-colors hover:text-foreground"
                  >
                    {t(`accountLinks.${key}`)}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{t("copyright", { year, brand, firm })}</p>
          <p className="max-w-xl text-xs leading-relaxed text-muted-foreground">
            {t("disclaimer", { firm })}
          </p>
        </div>
      </div>
    </footer>
  );
}
