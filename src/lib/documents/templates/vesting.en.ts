/** Server-only English vesting template */
export const vestingMasterTemplateEn = `FOUNDER VESTING AGREEMENT

Between:

(1) {{company_name}}, a company identified with Tax ID (NIT) {{company_id}}, hereinafter the "Company"; and

(2) {{founder_name}}, identified with {{founder_id}}, email {{founder_email}}, hereinafter the "Founder";

the Company and the Founder are collectively referred to as the "Parties."

1. BACKGROUND

The Founder is a shareholder of the Company and wishes to formalize a gradual vesting schedule over {{shares_total}} shares (the "Vesting Shares"), under the terms of this agreement.

2. VESTING SCHEDULE

2.1. Vesting Shares vest on a straight-line basis over {{vesting_months}} months, starting on {{vesting_start_date}} (the "Start Date").

2.2. Cliff period: no rights vest during the first {{cliff_months}} months. Upon completion of the cliff, the Founder shall have vested the proportion corresponding to the elapsed period under the linear schedule.

2.3. Schedule: unless accelerated under Section 3, rights in Vesting Shares vest monthly on a pro-rata basis after the cliff.

3. ACCELERATION

{{acceleration_clause}}

4. FOUNDER DEPARTURE

{{departure_clause}}

5. RESTRICTIONS AND TRANSFER

Until Vesting Shares are fully vested, the Founder may not sell, encumber, or transfer such shares without prior written consent of the Company, except as expressly permitted under the applicable shareholders agreement.

6. GOOD LEAVER

{{good_leaver_clause}}

7. ADDITIONAL PROVISIONS

{{additional_terms_block}}

8. GOVERNING LAW

This agreement is governed by the laws of the Republic of Colombia.`;

export const vestingAccelerationNoneEn =
  "No automatic acceleration applies. Vesting continues under the Section 2 schedule, unless otherwise agreed in writing by the Parties.";

export const vestingAccelerationSingleEn =
  "Single-trigger acceleration: upon a Liquidity Event approved by the board of directors, one hundred percent (100%) of unvested Vesting Shares shall be deemed vested immediately, subject to the shareholders agreement.";

export const vestingAccelerationDoubleEn =
  "Double-trigger acceleration: if a Change of Control occurs and, within twelve (12) months thereafter, the Founder is terminated without Cause, one hundred percent (100%) of unvested Vesting Shares shall be deemed vested immediately.";

export const vestingDepartureForfeitEn =
  "If the Founder separates for any reason before vesting is complete, unvested Vesting Shares revert to the Company without additional consideration, except as provided in the shareholders agreement.";

export const vestingDeparturePartialEn =
  "Upon Founder separation, unvested Vesting Shares may be repurchased by the Company at fair value under the shareholders agreement, considering the reason for separation.";

export const vestingDepartureNegotiableEn =
  "Upon Founder separation, treatment of unvested Vesting Shares shall be negotiated in good faith between the Parties, considering whether separation qualifies as Good Leaver under Section 6.";
