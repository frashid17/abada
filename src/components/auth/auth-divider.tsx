import { useTranslations } from "next-intl";

export function AuthDivider() {
  const t = useTranslations("auth");
  return (
    <div className="flex w-full items-center gap-3">
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {t("or")}
      </span>
      <div className="h-px flex-1 bg-border" />
    </div>
  );
}
