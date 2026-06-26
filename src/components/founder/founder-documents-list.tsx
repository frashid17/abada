import { getLocale, getTranslations } from "next-intl/server";
import { FounderDocumentCard } from "@/components/founder/founder-document-card";
import {
  getFounderDashboardInsights,
  sortDocumentsForDisplay,
} from "@/lib/documents/dashboard-insights";
import type { FounderDashboardData } from "@/lib/documents/dashboard";
import type { DocumentStatus } from "@/lib/documents/catalog";
import { cn } from "@/lib/utils";

type FounderDocumentsListProps = {
  data: FounderDashboardData;
  showHeading?: boolean;
  heading?: string;
  description?: string;
  variant?: "default" | "bento" | "catalog";
};

function formatUpdatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(locale, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export async function FounderDocumentsList({
  data,
  showHeading = true,
  heading,
  description,
  variant = "default",
}: FounderDocumentsListProps) {
  const t = await getTranslations("founder");
  const locale = await getLocale();
  const insights = getFounderDashboardInsights(data);
  const isBento = variant === "bento";
  const isCatalog = variant === "catalog";

  const documents = isCatalog
    ? [...data.documents].sort((a, b) => a.step - b.step)
    : sortDocumentsForDisplay(data.documents);

  const statusLabels = Object.fromEntries(
    (["not_started", "draft", "flagged", "in_review", "complete"] as DocumentStatus[]).map(
      (status) => [status, t(`dashboard.status.${status}`)],
    ),
  ) as Record<DocumentStatus, string>;

  return (
    <section className="space-y-5">
      {showHeading ? (
        <div className="space-y-1">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {heading ?? t("dashboard.allDocuments")}
            </h2>
            {!isCatalog ? (
              <p className="text-sm text-muted-foreground">
                {t("documentsPage.documentCount", { count: data.documents.length })}
              </p>
            ) : null}
          </div>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}

      <div
        className={cn(
          "grid gap-4",
          isCatalog && "md:grid-cols-2 xl:grid-cols-3",
          isBento && "md:grid-cols-2 xl:grid-cols-2",
          !isCatalog && !isBento && "md:grid-cols-2 xl:grid-cols-3",
        )}
      >
        {documents.map((doc) => {
          const featured = !isCatalog && insights.nextDocument?.documentType === doc.documentType;

          return (
            <div
              key={doc.documentType}
              className={cn(isBento && featured && "md:col-span-2")}
            >
              <FounderDocumentCard
                doc={doc}
                title={t(`documents.${doc.documentType}.title`)}
                description={t(`documents.${doc.documentType}.description`)}
                statusLabel={statusLabels[doc.status]}
                stepLabel={t("dashboard.step", { step: doc.step })}
                startLabel={t("dashboard.startDocument")}
                viewLabel={t("dashboard.viewDocument")}
                comingSoonLabel={t("dashboard.comingSoonBadge")}
                updatedLabel={t("dashboard.updated", {
                  date: formatUpdatedAt(doc.updatedAt, locale),
                })}
                featured={featured}
                featuredLayout={isBento && featured}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
