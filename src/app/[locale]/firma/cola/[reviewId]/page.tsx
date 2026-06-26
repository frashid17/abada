import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { ReviewMarkupForm } from "@/components/firm/review-markup-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getFirmReview } from "@/lib/firm/reviews";
import { requireFirmPageAccess } from "@/lib/firm/session";

export default async function FirmReviewDetailPage({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  await requireFirmPageAccess(`/firma/cola/${reviewId}`);

  const review = await getFirmReview(reviewId);
  if (!review) notFound();

  const t = await getTranslations("firm.review");
  const tFounder = await getTranslations("founder");

  const fieldEntries = Object.entries(review.fields).filter(
    ([, value]) => value !== "" && value !== undefined,
  );

  return (
    <AppShell variant="firm">
      <div className="space-y-8">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={tFounder(`documents.${review.documentType}.title`)}
          description={t("subtitle", { status: t(`status.${review.status}`) })}
        />

        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <div className="space-y-6">
            {review.helpMessage ? (
              <Card variant="feature">
                <CardHeader>
                  <CardTitle className="text-base">{t("founderRequest")}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                    {review.helpMessage}
                  </p>
                </CardContent>
              </Card>
            ) : null}

            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-base">{t("intakeTitle")}</CardTitle>
                <CardDescription>{t("intakeDescription")}</CardDescription>
              </CardHeader>
              <CardContent>
                {fieldEntries.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t("noFields")}</p>
                ) : (
                  <dl className="divide-y divide-border/60">
                    {fieldEntries.map(([key, value]) => (
                      <div key={key} className="grid gap-1 py-3 sm:grid-cols-[200px_1fr]">
                        <dt className="text-xs font-medium text-muted-foreground">{key}</dt>
                        <dd className="text-sm">{String(value)}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </CardContent>
            </Card>
          </div>

          <Card variant="elevated" className="h-fit lg:sticky lg:top-24">
            <CardHeader>
              <CardTitle className="text-base">{t("markupTitle")}</CardTitle>
              <CardDescription>{t("markupDescription")}</CardDescription>
            </CardHeader>
            <CardContent>
              <ReviewMarkupForm
                reviewId={review.id}
                initialStatus={review.status}
                initialNotes={review.markup.notes ?? ""}
                initialExecutiveSummary={review.executiveSummary ?? ""}
                attorneyName={review.markup.attorneyName}
                signedAt={review.markup.signedAt}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
