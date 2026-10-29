import {
  CURRENT_TERMS_VERSION,
  getTermsHtml,
  hasAcceptedCurrentTerms,
  type TermsLocale,
} from "@/lib/legal/terms";

export type TermsGateProps = {
  needsAcceptance: boolean;
  termsHtml: string;
  termsVersion: string;
};

export async function getTermsGateProps(
  userId: string,
  locale: TermsLocale,
): Promise<TermsGateProps> {
  const [accepted, termsHtml] = await Promise.all([
    hasAcceptedCurrentTerms(userId),
    Promise.resolve(getTermsHtml(locale)),
  ]);

  return {
    needsAcceptance: !accepted,
    termsHtml,
    termsVersion: CURRENT_TERMS_VERSION,
  };
}
