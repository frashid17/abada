import { auth } from "@clerk/nextjs/server";
import { getTranslations } from "next-intl/server";
import { BrandMark } from "@/components/brand/brand-mark";
import { Link } from "@/i18n/navigation";
import { getBrandName, getFirmName } from "@/lib/brand";

type FooterVariant = "public" | "founder" | "investor" | "firm" | "admin";

type SiteFooterProps = {
  variant?: FooterVariant;
};

export async function SiteFooter({ variant = "public" }: SiteFooterProps) {
  const t = await getTranslations("footer");
  const tShell = await getTranslations("shell");
  const { userId } = await auth();
  const brand = getBrandName();
  const firm = getFirmName();
  const year = new Date().getFullYear();
  const isApp = variant !== "public";
  const showAuthLinks = !userId && !isApp;

  if (!isApp) {
    return (
      <footer className="relative z-10 mt-auto shrink-0 border-t border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <div
            className={
              showAuthLinks
                ? "grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]"
                : "grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr]"
            }
          >
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
                {(
                  [
                    { href: "/registro", key: "founders" },
                    { href: "/registro", key: "investors" },
                    { href: "/iniciar-sesion?redirect_url=/firma", key: "firm" },
                    { href: "/conocimiento", key: "knowledge" },
                  ] as const
                ).map(({ href, key }) => (
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

            {showAuthLinks ? (
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                  {t("account")}
                </p>
                <ul className="mt-4 space-y-2.5">
                  <li>
                    <Link
                      href="/iniciar-sesion"
                      className="cursor-pointer text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {t("accountLinks.signIn")}
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/registro"
                      className="cursor-pointer text-sm text-foreground/80 transition-colors hover:text-foreground"
                    >
                      {t("accountLinks.signUp")}
                    </Link>
                  </li>
                </ul>
              </div>
            ) : null}
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

  const productLinks =
    variant === "founder"
      ? [
          { href: "/fundador/documentos", label: tShell("nav.documents") },
          { href: "/fundador/sala", label: tShell("nav.dataRoom") },
          { href: "/fundador/leyes", label: tShell("nav.laws") },
          { href: "/fundador", label: tShell("nav.dashboard") },
        ]
      : variant === "firm"
        ? [
            { href: "/firma/dd", label: tShell("nav.dd") },
            { href: "/firma/cola", label: tShell("nav.queue") },
            { href: "/firma/equipo", label: tShell("nav.team") },
            { href: "/firma", label: tShell("nav.dashboard") },
          ]
        : variant === "investor"
          ? [
              { href: "/inversionista/salas", label: tShell("nav.rooms") },
              { href: "/inversionista", label: tShell("nav.dashboard") },
            ]
          : [
              { href: "/admin", label: tShell("nav.adminOverview") },
              { href: "/admin/corpus", label: tShell("nav.adminCorpus") },
            ];

  return (
    <footer className="relative z-10 mt-auto shrink-0 border-t-2 border-border bg-card">
      <div className="mx-auto max-w-[1240px] px-4 py-10 sm:px-5">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
          <div className="space-y-3">
            <Link href={productLinks[0]?.href ?? "/"} className="inline-block cursor-pointer">
              <BrandMark wordmark={brand} />
            </Link>
            <p className="max-w-[34ch] text-sm leading-relaxed text-muted-foreground">
              {t("tagline")}
            </p>
          </div>

          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("product")}
            </p>
            <ul className="mt-3 space-y-1">
              {productLinks.map((item) => (
                <li key={`${item.href}-${item.label}`}>
                  <Link
                    href={item.href}
                    className="block cursor-pointer py-0.5 text-[14.5px] text-[color:var(--ink-2)] transition-colors hover:text-accent-fg"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("legal")}
            </p>
            <ul className="mt-3 space-y-1">
              <li className="block py-0.5 text-[14.5px] text-[color:var(--ink-2)]">
                {t("balamConsult", { firm })}
              </li>
              <li className="block py-0.5 text-[14.5px] text-[color:var(--ink-2)]">{t("terms")}</li>
              <li className="block py-0.5 text-[14.5px] text-[color:var(--ink-2)]">{t("privacy")}</li>
            </ul>
          </div>

          <div>
            <p className="text-[11.5px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
              {t("contact")}
            </p>
            <ul className="mt-3 space-y-1">
              <li>
                <a
                  href="mailto:hola@abada.co"
                  className="block py-0.5 text-[14.5px] text-[color:var(--ink-2)] transition-colors hover:text-accent-fg"
                >
                  hola@abada.co
                </a>
              </li>
              <li className="block py-0.5 text-[14.5px] text-[color:var(--ink-2)]">{t("city")}</li>
            </ul>
          </div>
        </div>

        <p className="mt-9 max-w-[82ch] border-t border-[color:var(--line-2)] pt-4 text-xs leading-relaxed text-muted-foreground">
          {t("disclaimer", { firm })}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">{t("copyright", { year, brand, firm })}</p>
      </div>
    </footer>
  );
}
