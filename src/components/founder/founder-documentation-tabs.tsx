"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  TEMPLATES_BASE_PATH,
  LEARN_DOCUMENT_TYPES,
  learnTypeToSlug,
} from "@/lib/documents/learn/routes";
import type { LearnDocumentType } from "@/lib/documents/learn/render-learn-document";
import { cn } from "@/lib/utils";

type FounderDocumentationTabsProps = {
  activeDocument: LearnDocumentType;
};

export function FounderDocumentationTabs({ activeDocument }: FounderDocumentationTabsProps) {
  const tLearn = useTranslations("founder.learn");
  const tTemplates = useTranslations("founder.templates");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary">
          {tTemplates("eyebrow")}
        </p>
        <p className="mt-0.5 text-sm text-muted-foreground">{tTemplates("subtitle")}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {LEARN_DOCUMENT_TYPES.map((documentType) => {
          const href = `${TEMPLATES_BASE_PATH}/${learnTypeToSlug(documentType)}`;
          const isActive = documentType === activeDocument;

          return (
            <Link
              key={documentType}
              href={href}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-sm"
                  : "border-border/70 bg-card text-muted-foreground hover:border-primary/30 hover:text-foreground",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {tLearn(`documents.${documentType}.tabLabel`)}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
