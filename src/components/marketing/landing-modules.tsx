import { getTranslations } from "next-intl/server";
import { MODULE_ICONS } from "@/components/founder/document-icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const MODULE_KEYS = ["readiness", "diligence", "review"] as const;

export async function LandingModules() {
  const t = await getTranslations("public");

  return (
    <section className="space-y-8">
      <div className="max-w-2xl space-y-2">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">
          {t("modulesTitle")}
        </h2>
        <p className="text-lg text-muted-foreground">{t("modulesSubtitle")}</p>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {MODULE_KEYS.map((key) => {
          const Icon = MODULE_ICONS[key];
          return (
            <Card key={key} variant="elevated" className="group h-full">
              <CardHeader>
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-colors duration-200 group-hover:bg-cta group-hover:text-cta-foreground">
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle>{t(`modules.${key}.title`)}</CardTitle>
                <CardDescription>{t(`modules.${key}.description`)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(`modules.${key}.body`)}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
