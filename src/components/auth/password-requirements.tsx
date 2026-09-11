"use client";

import { Check, Circle } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  evaluatePassword,
  type PasswordRuleId,
} from "@/lib/auth/password-policy";
import { cn } from "@/lib/utils";

const RULE_ORDER: PasswordRuleId[] = ["minLength", "lower", "upper", "number"];

export function PasswordRequirements({ password }: { password: string }) {
  const t = useTranslations("auth.signUp.passwordRules");
  const results = evaluatePassword(password);
  const byId = Object.fromEntries(results.map((rule) => [rule.id, rule.ok])) as Record<
    PasswordRuleId,
    boolean
  >;
  const started = password.length > 0;

  return (
    <div className="space-y-2 rounded-lg border border-border/70 bg-muted/30 px-3 py-2.5">
      <p className="text-xs font-medium text-foreground">{t("title")}</p>
      <ul className="space-y-1.5">
        {RULE_ORDER.map((id) => {
          const ok = byId[id];
          return (
            <li
              key={id}
              className={cn(
                "flex items-center gap-2 text-xs",
                ok ? "text-good" : started ? "text-muted-foreground" : "text-muted-foreground",
              )}
            >
              {ok ? (
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
              ) : (
                <Circle className="h-3.5 w-3.5 shrink-0 opacity-50" aria-hidden />
              )}
              <span>{t(id)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
