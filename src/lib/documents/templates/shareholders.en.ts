/** Server-only English shareholders agreement template */
export const shareholdersMasterTemplateEn = `SHAREHOLDERS AGREEMENT

Among the shareholders of {{company_name}}, identified with Tax ID (NIT) {{company_id}}, hereinafter the "Company," and in particular lead investor {{lead_investor_name}} ({{lead_investor_id}}), this Shareholders Agreement is entered into effective {{effective_date}}.

1. PURPOSE

To govern rights and obligations among the Company's shareholders in connection with a venture capital investment in Colombia, including transfer restrictions, drag-along and tag-along mechanics, anti-dilution protection, and corporate governance rules.

2. TRANSFER RESTRICTIONS

No shareholder may sell, encumber, or transfer shares without complying with rights of first refusal and other restrictions adopted by the shareholders meeting under applicable law and bylaws.

3. DRAG-ALONG

If shareholders representing at least {{drag_along_threshold_pct}}% of share capital vote in favor of a sale of the Company or substantially all assets, other shareholders shall vote and sell on the same economic and legal terms, unless mandatory law provides otherwise.

4. TAG-ALONG

{{tag_along_clause}}

5. ANTI-DILUTION

{{anti_dilution_clause}}

6. SHAREHOLDER RESERVED MATTERS

Matters requiring qualified majority approval shall require the favorable vote of shareholders representing at least {{qualified_majority_pct}}% of share capital, including issuance of new series, material indebtedness outside the ordinary course, sale of essential assets, relevant change of corporate purpose, and modification of preferential rights.

7. FOUNDER VESTING AND DEPARTURE

Founder vesting is governed by the vesting agreement with the Company and incorporated by reference. Good/bad leaver definitions shall align with Colombian venture practice and be validated by the firm in review.

8. CONFIDENTIALITY

Economic and strategic terms of this agreement are confidential, except as required by law, regulators, or investors with a need to know.

9. DISPUTE RESOLUTION

{{dispute_resolution_clause}}

10. GOVERNING LAW

Colombian law. Contractual domicile and jurisdiction: {{jurisdiction_city}}.`;

export const shareholdersTagAlongYesEn =
  "If one or more majority shareholders sell shares to a third party, minority shareholders shall have the right to participate in the sale on a pro-rata basis and on the same terms (tag-along), upon written notice within the period specified for the transaction.";

export const shareholdersTagAlongNoEn =
  "No tag-along clause is included in this draft version; the firm will assess whether to add one based on fund negotiation.";

export const shareholdersAntiDilutionNoneEn =
  "No anti-dilution adjustment is agreed for this round. Future issuances are governed by bylaws and applicable law.";

export const shareholdersAntiDilutionBroadEn =
  "A broad-based weighted average anti-dilution mechanism is adopted to protect investors in this round against future issuances at a lower price, with formula and exceptions to be finalized in firm review.";

export const shareholdersDisputeArbitrationEn =
  "Disputes shall be resolved by arbitration in law before a recognized arbitration center in Colombia, seated in the contractual city, under applicable rules.";

export const shareholdersDisputeCourtsEn =
  "Disputes shall be submitted to the competent courts of the Republic of Colombia at the contractual domicile, without prejudice to urgent injunctive relief.";
