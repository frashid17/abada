import { getTranslations } from "next-intl/server";
import { ProgressRing } from "@/components/ui/progress-ring";
import type { FounderDashboardData } from "@/lib/documents/dashboard";
import { cn } from "@/lib/utils";

type FounderDocumentsCatalogHeaderProps = {
  data: FounderDashboardData;
  className?: string;
};

export async function FounderDocumentsCatalogHeader({
  data,
  className,
}: FounderDocumentsCatalogHeaderProps) {
  const t = await getTranslations("founder");

  return (
    <header
      className={cn(
        "flex flex-col gap-6 border-b border-border/60 pb-8 lg:flex-row lg:items-end lg:justify-between",
        className,
      )}
    >
      <div className="max-w-2xl space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-highlight">
          {t("documentsPage.eyebrow")}
        </p>
        <h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("documentsPage.title")}
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground">
          {t("documentsPage.catalogSubtitle")}
        </p>
      </div>

      <div className="shrink-0 rounded-2xl border border-border/60 bg-muted/30 px-5 py-4">
        <ProgressRing
          value={data.completedCount}
          max={data.totalCount}
          label={t("dashboard.progress", {
            completed: data.completedCount,
            total: data.totalCount,
          })}
        />
      </div>
    </header>
  );
}
