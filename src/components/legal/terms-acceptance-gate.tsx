"use client";

import type { ReactNode } from "react";
import { TermsAcceptanceModal } from "@/components/legal/terms-acceptance-modal";

type TermsAcceptanceGateProps = {
  needsAcceptance: boolean;
  termsHtml: string;
  termsVersion: string;
  children: ReactNode;
};

/** Blocks founder document surfaces until current ToS version is accepted. */
export function TermsAcceptanceGate({
  needsAcceptance,
  termsHtml,
  termsVersion,
  children,
}: TermsAcceptanceGateProps) {
  return (
    <>
      <div
        aria-hidden={needsAcceptance || undefined}
        className={needsAcceptance ? "pointer-events-none select-none opacity-40" : undefined}
      >
        {children}
      </div>
      <TermsAcceptanceModal
        open={needsAcceptance}
        termsHtml={termsHtml}
        termsVersion={termsVersion}
      />
    </>
  );
}
