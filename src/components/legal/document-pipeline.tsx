import { cn } from "@/lib/utils";

type DocumentPipelineProps = {
  title: string;
  subtitle: string;
  steps: ReadonlyArray<{ step: number; label: string }>;
  className?: string;
};

export function DocumentPipeline({ title, subtitle, steps, className }: DocumentPipelineProps) {
  return (
    <section className={cn("space-y-8", className)}>
      <div className="max-w-2xl space-y-2">
        <h2 className="font-serif text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
        <p className="text-lg text-muted-foreground">{subtitle}</p>
      </div>

      <ol className="relative grid gap-4 md:grid-cols-5">
        {steps.map(({ step, label }, index) => (
          <li key={step} className="relative">
            {index < steps.length - 1 ? (
              <span
                className="absolute left-[calc(50%+1.25rem)] top-6 hidden h-px w-[calc(100%-2.5rem)] bg-border md:block"
                aria-hidden
              />
            ) : null}
            <div className="surface-panel relative flex h-full flex-col items-center rounded-2xl p-4 text-center transition-all duration-200 hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
                {step}
              </span>
              <p className="mt-3 text-sm font-medium leading-snug text-foreground">{label}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
