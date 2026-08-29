"use client";

import { useMemo, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  reopenDdQuestionnaireAction,
  saveDdQuestionnaireAction,
  submitDdQuestionnaireAction,
} from "@/lib/dd/questionnaire-actions";
import type { AdminDdQuestion } from "@/lib/dd/questionnaire-cms";
import type { DdAnswerMap, DdQuestionnaireRecord } from "@/lib/dd/questionnaire";
import type { DealRecord } from "@/lib/deals/types";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const SECTION_ORDER = ["fundadores", "incentivos", "pi", "declaration", "cross"] as const;

export function FounderDiligenceForm({
  questionnaire,
  questions,
  initialAnswers,
  deals,
}: {
  questionnaire: DdQuestionnaireRecord;
  questions: AdminDdQuestion[];
  initialAnswers: DdAnswerMap;
  deals: DealRecord[];
}) {
  const t = useTranslations("founder.diligence");
  const locale = useLocale();
  const lang = locale.startsWith("en") ? "en" : "es";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [dealId, setDealId] = useState(questionnaire.dealId ?? deals[0]?.id ?? "");
  const [answers, setAnswers] = useState<DdAnswerMap>(() => {
    const next: DdAnswerMap = { ...initialAnswers };
    for (const question of questions) {
      if (!next[question.id]) next[question.id] = { value: "", note: "" };
    }
    return next;
  });
  const [message, setMessage] = useState<string | null>(null);

  const grouped = useMemo(() => {
    return SECTION_ORDER.map((section) => ({
      section,
      items: questions.filter((q) => q.sectionKey === section),
    })).filter((group) => group.items.length > 0);
  }, [questions]);

  const submitted = questionnaire.status === "submitted";

  function setAnswer(questionId: string, patch: Partial<{ value: string; note: string }>) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: { ...prev[questionId]!, ...patch },
    }));
  }

  function payload() {
    return Object.entries(answers).map(([questionId, row]) => ({
      questionId,
      value: row.value,
      note: row.note,
    }));
  }

  return (
    <div className="space-y-8">
      <div className="rounded-xl border border-border bg-card p-4">
        <Label>{t("dealLabel")}</Label>
        {deals.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">{t("noDeals")}</p>
        ) : (
          <select
            className="mt-2 flex h-10 w-full max-w-md rounded-md border border-input bg-background px-3 text-sm"
            value={dealId}
            disabled={submitted || pending}
            onChange={(e) => setDealId(e.target.value)}
          >
            {deals.map((deal) => (
              <option key={deal.id} value={deal.id}>
                {deal.name}
              </option>
            ))}
          </select>
        )}
        <p className="mt-2 text-sm text-muted-foreground">{t("dealHint")}</p>
      </div>

      {grouped.map((group) => (
        <section key={group.section} className="space-y-4">
          <h2 className="font-serif text-xl font-semibold">{t(`sections.${group.section}`)}</h2>
          <div className="space-y-4">
            {group.items.map((question) => {
              const answer = answers[question.id] ?? { value: "", note: "" };
              const label = lang === "en" ? question.qEn : question.qEs;
              const hint = lang === "en" ? question.hintEn : question.hintEs;
              return (
                <div key={question.id} className="rounded-xl border border-border bg-card p-4">
                  <p className="font-medium text-foreground">{label}</p>
                  {hint ? <p className="mt-1 text-sm text-muted-foreground">{hint}</p> : null}
                  {question.answerType === "text" ? (
                    <Textarea
                      className="mt-3"
                      rows={3}
                      disabled={submitted || pending}
                      value={answer.value}
                      onChange={(e) => setAnswer(question.id, { value: e.target.value })}
                    />
                  ) : (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {(question.answerType === "yes_no_na"
                        ? (["yes", "no", "na"] as const)
                        : (["yes", "no"] as const)
                      ).map((option) => (
                        <button
                          key={option}
                          type="button"
                          disabled={submitted || pending}
                          aria-pressed={answer.value === option}
                          onClick={() => setAnswer(question.id, { value: option })}
                          className={cn(
                            "rounded-lg border px-3 py-1.5 text-sm font-medium",
                            answer.value === option
                              ? "border-primary bg-primary/10 text-foreground"
                              : "border-border text-muted-foreground hover:bg-muted",
                          )}
                        >
                          {t(`answers.${option}`)}
                        </button>
                      ))}
                    </div>
                  )}
                  <Textarea
                    className="mt-3"
                    rows={2}
                    placeholder={t("notePlaceholder")}
                    disabled={submitted || pending}
                    value={answer.note}
                    onChange={(e) => setAnswer(question.id, { note: e.target.value })}
                  />
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}

      <div className="flex flex-wrap gap-2">
        {!submitted ? (
          <>
            <Button
              type="button"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await saveDdQuestionnaireAction({
                    questionnaireId: questionnaire.id,
                    dealId: dealId || null,
                    answers: payload(),
                  });
                  setMessage(t("saved"));
                  router.refresh();
                })
              }
            >
              {t("save")}
            </Button>
            <Button
              type="button"
              variant="cta"
              disabled={pending || !dealId}
              onClick={() =>
                startTransition(async () => {
                  await saveDdQuestionnaireAction({
                    questionnaireId: questionnaire.id,
                    dealId,
                    answers: payload(),
                  });
                  const result = await submitDdQuestionnaireAction({
                    questionnaireId: questionnaire.id,
                    dealId,
                    locale: lang,
                  });
                  setMessage(t("submitted", { count: result.findingCount }));
                  router.refresh();
                })
              }
            >
              {t("submit")}
            </Button>
          </>
        ) : (
          <Button
            type="button"
            variant="outline"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await reopenDdQuestionnaireAction(questionnaire.id);
                setMessage(t("reopened"));
                router.refresh();
              })
            }
          >
            {t("reopen")}
          </Button>
        )}
      </div>
    </div>
  );
}
