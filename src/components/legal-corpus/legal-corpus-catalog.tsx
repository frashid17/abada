import Link from "next/link";
import { Scale, BookOpen, Gavel, FileText, Landmark, Globe } from "lucide-react";
import type { LegalSourceSummary } from "@/lib/legal-corpus/service";
import type { LegalSourceType } from "@/lib/legal-corpus";
import { legalSourcePath } from "@/lib/legal-corpus/routes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const TYPE_ICONS: Record<LegalSourceType, typeof Scale> = {
  constitution: Landmark,
  code: BookOpen,
  statute: Gavel,
  decree: FileText,
  circular: Scale,
  decision: Globe,
};

type LegalCorpusCatalogProps = {
  sources: LegalSourceSummary[];
  typeLabels: Record<LegalSourceType, string>;
  readLabel: string;
  articleCountLabel: (count: number) => string;
};

export function LegalCorpusCatalog({
  sources,
  typeLabels,
  readLabel,
  articleCountLabel,
}: LegalCorpusCatalogProps) {
  const grouped = sources.reduce<Record<string, LegalSourceSummary[]>>((acc, source) => {
    const key = source.sourceType;
    if (!acc[key]) acc[key] = [];
    acc[key]!.push(source);
    return acc;
  }, {});

  const order: LegalSourceType[] = [
    "constitution",
    "code",
    "statute",
    "decree",
    "circular",
    "decision",
  ];

  return (
    <div className="space-y-10">
      {order.map((type) => {
        const items = grouped[type];
        if (!items?.length) return null;
        const Icon = TYPE_ICONS[type];

        return (
          <section key={type} className="space-y-4">
            <div className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" aria-hidden />
              <h2 className="text-sm font-bold uppercase tracking-[0.12em] text-muted-foreground">
                {typeLabels[type]}
              </h2>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {items.map((source) => (
                <Card key={source.id} variant="elevated" className="h-full">
                  <CardHeader>
                    <CardTitle className="text-base leading-snug">
                      <Link href={legalSourcePath(source.id)} className="hover:text-primary">
                        {source.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>{source.citation}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="line-clamp-2 text-sm text-muted-foreground">{source.description}</p>
                    <p className={cn("text-xs text-muted-foreground")}>
                      {articleCountLabel(source.chunkCount)}
                    </p>
                    <Link
                      href={legalSourcePath(source.id)}
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {readLabel}
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
