import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, FileText } from "lucide-react";
import type { ReviewQueueItem } from "@/lib/firm/reviews";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type ReviewQueueListProps = {
  reviews: ReviewQueueItem[];
};

export async function ReviewQueueList({ reviews }: ReviewQueueListProps) {
  const t = await getTranslations("firm.queue");

  if (reviews.length === 0) {
    return (
      <Card variant="elevated" className="max-w-2xl">
        <CardContent className="p-6">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("empty")}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {reviews.map((review) => (
        <Card key={review.id} variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {t(`documentTypes.${review.documentType}`)}
                  </CardTitle>
                  <CardDescription>
                    {t("requester", { id: review.requesterSub.slice(0, 8) })}
                  </CardDescription>
                </div>
              </div>
              <span className="rounded-full border border-border/70 bg-muted/50 px-2.5 py-0.5 text-xs font-medium">
                {t(`status.${review.status}`)}
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {review.helpMessage ? (
              <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
                {review.helpMessage}
              </p>
            ) : null}
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs text-muted-foreground">
                {t("submitted", {
                  date: new Date(review.createdAt).toLocaleDateString("es-CO"),
                })}
              </p>
              <Link
                href={`/firma/cola/${review.id}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                {t("openReview")}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
