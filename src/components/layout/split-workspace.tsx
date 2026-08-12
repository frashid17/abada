"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type SplitWorkspaceProps = {
  primary: React.ReactNode;
  secondary: React.ReactNode;
  primaryLabel: string;
  secondaryLabel: string;
  panesLabel: string;
};

type Pane = "primary" | "secondary";

/** Independent-scroll split panes on desktop; tabbed panes on mobile. */
export function SplitWorkspace({
  primary,
  secondary,
  primaryLabel,
  secondaryLabel,
  panesLabel,
}: SplitWorkspaceProps) {
  const [pane, setPane] = useState<Pane>("primary");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => {
      if (media.matches) setPane("primary");
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div
        role="tablist"
        aria-label={panesLabel}
        className="grid shrink-0 grid-cols-2 gap-1 rounded-xl border border-border/70 bg-muted/30 p-1 lg:hidden"
      >
        {(
          [
            { id: "primary" as const, label: primaryLabel },
            { id: "secondary" as const, label: secondaryLabel },
          ] as const
        ).map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={pane === item.id}
            className={cn(
              "cursor-pointer rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              pane === item.id
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
            onClick={() => setPane(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(300px,380px)]">
        <section
          aria-label={primaryLabel}
          className={cn(
            "min-h-0 space-y-6 overflow-y-auto overscroll-y-contain pr-1 [-webkit-overflow-scrolling:touch]",
            pane !== "primary" && "hidden lg:block",
          )}
        >
          {primary}
        </section>

        <aside
          aria-label={secondaryLabel}
          className={cn(
            "min-h-0 overflow-y-auto overscroll-y-contain lg:border-l lg:border-border/60 lg:pl-5 [-webkit-overflow-scrolling:touch]",
            pane !== "secondary" && "hidden lg:block",
          )}
        >
          <div className="pb-8 lg:pb-4">{secondary}</div>
        </aside>
      </div>
    </div>
  );
}
