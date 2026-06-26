import { getTranslations } from "next-intl/server";
import { FileText, FolderCheck, Shield } from "lucide-react";
import type { DealRoomSummary } from "@/lib/deals/summaries";

type DealRoomStatsProps = {
  summary: DealRoomSummary;
  variant: "founder" | "investor";
};

export async function DealRoomStats({ summary, variant }: DealRoomStatsProps) {
  const t = await getTranslations(variant === "founder" ? "founder.sala" : "investor.room");

  const items =
    variant === "founder"
      ? [
          {
            icon: FileText,
            label: t("stats.documents"),
            value: String(summary.documentCount),
          },
          {
            icon: FolderCheck,
            label: t("stats.categories"),
            value: `${summary.categoriesCovered}/${summary.totalCategories}`,
          },
        ]
      : [
          {
            icon: FileText,
            label: t("stats.documents"),
            value: String(summary.documentCount),
          },
          {
            icon: Shield,
            label: t("stats.findings"),
            value: String(summary.findingCount),
          },
          {
            icon: Shield,
            label: t("stats.assessment"),
            value: summary.hasPublishedAssessment ? t("stats.published") : t("stats.pending"),
          },
        ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center gap-3 rounded-xl border border-border/70 bg-muted/30 px-4 py-3"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <item.icon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="font-semibold tabular-nums text-foreground">{item.value}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
