import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, FolderOpen } from "lucide-react";
import type { DealRecord } from "@/lib/deals/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type DealListProps = {
  deals: DealRecord[];
  basePath: "/firma/dd" | "/fundador/sala";
  emptyKey: "firm.dd.empty" | "founder.sala.empty";
};

export async function DealList({ deals, basePath, emptyKey }: DealListProps) {
  const t = await getTranslations(emptyKey.startsWith("firm") ? "firm.dd" : "founder.sala");

  if (deals.length === 0) {
    return (
      <Card variant="elevated" className="max-w-2xl">
        <CardContent className="p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">
            {emptyKey === "firm.dd.empty" ? t("empty") : t("empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {deals.map((deal) => (
        <Card key={deal.id} variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <FolderOpen className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base">{deal.name}</CardTitle>
                <CardDescription>{t("status", { status: deal.status })}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Link
              href={`${basePath}/${deal.id}`}
              className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {t("openDeal")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
