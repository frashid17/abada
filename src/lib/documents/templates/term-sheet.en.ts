/** Server-only master template — Series A Term Sheet (Colombian VC) */
export const termSheetMasterTemplateEn = `TERM SHEET FOR PREFERRED SHARE FINANCING OF {{company_name}} S.A.S.

{{closing_month}} {{closing_day}}, {{closing_year}}

This Term Sheet summarizes the principal terms of the investment in Preferred Shares by {{lead_investor_name}} (the "Investor") in {{company_name}} S.A.S., a simplified stock company incorporated in Colombia (the "Company").

In consideration of the time and expense devoted and to be devoted by the Company with respect to this investment, the Non-Negotiation/Confidentiality provisions of this Term Sheet shall be binding obligations of the Company, whether or not the financing is consummated. No other legally binding obligations shall be created until definitive agreements are executed and delivered by all parties.

This Term Sheet is not a commitment to issue shares and is conditioned upon Board approval of the issuance. This Term Sheet shall be governed in all respects by the laws of Colombia.

1. OFFER TERMS

Closing Date: As soon as practicable after acceptance of this Term Sheet by the Company and satisfaction of the Closing Conditions (the "Closing"). The target closing date is {{target_closing_date}}.

Investors:
{{investor_schedule}}

Founders: {{founder_names}}.

Maximum Investment Amount: COP {{max_investment_cop}}, representing {{investor_ownership_pct}}% of the Company's capital.

Price Per Share: COP {{price_per_share_cop}} per share (based on the capitalization set forth below) (the "Original Purchase Price").

Post-Money Valuation: The Original Purchase Price is based on a fully diluted post-money valuation of COP {{post_money_valuation_cop}}.

Capitalization: The Company's capitalization structure before and after Closing is set forth in Schedule A.

Use of Proceeds: Investment proceeds shall be used solely to develop the business plan described in Schedule B (the "Business Plan").

2. DIVIDENDS

Dividends on Preferred Shares shall be paid on an as-converted basis when, as, and if paid on any other class of capital stock. In any event, shareholders agree that the Company shall not declare dividends for {{dividend_lockup_years}} years following issuance of the Preferred Shares.

3. LIQUIDATION PREFERENCE

In any liquidation, dissolution, or winding up of the Company, proceeds shall be distributed as follows: First, holders of Preferred Shares shall receive {{liquidation_multiple}} times the Original Purchase Price (or, if greater, the amount Preferred Shares would receive on an as-converted basis). Thereafter, remaining proceeds shall be distributed pro rata to holders of Common Shares.

A merger or consolidation (other than one in which Company shareholders retain majority voting power of the surviving or acquiring entity) and a sale, lease, transfer, exclusive license, or other disposition of all or substantially all Company assets shall be treated as a liquidation event (a "Liquidation Event"), triggering the liquidation preferences described above, unless holders of {{liquidation_waiver_pct}}% of Preferred Shares elect otherwise.

4. VOTING RIGHTS

Preferred Shares shall vote with Common Shares on an as-converted basis, and not as a separate class, except that (i) Preferred Shares as a class shall be entitled to elect one (1) Board member (the "Investor Director"), and (ii) as required by law.

The Company's bylaws shall provide that authorized Common Shares may be increased or decreased with approval of a majority of Preferred and Common Shares voting together as a single class, without a separate class vote of Common Shares.

Preferred Shares shall carry one vote per share and Common Shares shall carry {{common_votes_per_share}} votes per share.

5. INVESTOR PROTECTIVE PROVISIONS

So long as any Preferred Shares remain outstanding, in addition to any other vote or approval required under the Company's bylaws, the Company shall not, without the written consent of the requisite majority, equivalent to {{protective_majority_pct}}% of the Company's Preferred Shares, whether directly or by amendment, merger, consolidation, or otherwise:

(i) liquidate, dissolve, or wind up the Company's affairs, or effect any merger, consolidation, or other Liquidation Event;
(ii) amend, alter, or repeal any provision of the bylaws;
(iii) create or authorize any security convertible into or exercisable for capital stock with rights, preferences, or privileges senior or pari passu with Preferred Shares, or increase authorized Preferred Shares;
(iv) repurchase or redeem shares, or pay dividends on any capital stock senior to Preferred Shares, except repurchases from former employees or consultants at the lesser of fair market value or cost;
(v) create or authorize debt in excess of COP {{debt_threshold_cop}} without prior Board approval, including approval of the Director elected by Preferred Shares;
(vi) create or hold equity in any non-wholly-owned subsidiary, or dispose of subsidiary equity or substantially all subsidiary assets;
(vii) increase or decrease Board size;
(viii) change the Company's business or mission such that the core business is no longer pursued; or
(ix) approve any employee stock option plan or other equity-based plan, or increase shares reserved thereunder.

6. OPTIONAL CONVERSION

Preferred Shares shall initially convert 1:1 into Common Shares at the option of the holder at any time.

7. SUBSCRIPTION AGREEMENT

Standard and customary representations and warranties by the Company and customary indemnities by the Company in favor of the Investor(s).

Closing Conditions: Standard conditions to Closing, including, among others: (i) satisfactory completion of financial and legal due diligence; (ii) receipt of all required authorizations, approvals, and consents; (iii) amendment of bylaws to establish Preferred Share rights and preferences; (iv) execution of customary definitive agreements, including a subscription agreement and shareholders agreement; (v) execution of Non-Compete Agreements; and (vi) absence of material adverse changes to the Company.

Advisory Fees and Expenses: Each party shall bear its own legal and administrative costs related to the financing at Closing, including due diligence costs.

8. MANAGEMENT AND INFORMATION RIGHTS

Investors shall have access to Company facilities and personnel during normal business hours upon reasonable prior notice. The Company shall deliver to such Investor (i) annual, quarterly, and other information as determined by the Board; (ii) a comprehensive operating budget and business plan thirty days before each fiscal year end; and (iii) an updated capitalization table promptly after each quarter end.

9. PRO RATA PARTICIPATION RIGHTS

Investors and Founders shall have a pro rata right, based on their shareholding percentage (assuming conversion of all outstanding Preferred Shares and exercise of all outstanding options), to participate in subsequent issuances of Company capital stock. If any Investor declines its full pro rata allocation, remaining Investor(s) may purchase the unsubscribed pro rata shares.

10. SUPERMAJORITY AND NON-COMPETE

The Company shall not, without the affirmative vote of at least {{board_supermajority_count}} of the {{board_size}} Board members: (i) hire, terminate, or change compensation by more than {{ceo_comp_change_pct}}% annually for the CEO or any executive officer with annual compensation exceeding COP {{executive_comp_threshold_cop}}, including approval of any option grants; (ii) approve the Company's annual budget; and (iii) hire or change the Company's auditors.

Each Founder and key employee shall enter into a non-compete and non-solicit agreement for {{non_compete_years}} years in a form reasonably acceptable to Investors (the "Non-Compete Agreements").

11. RIGHT OF FIRST OFFER AND TAG-ALONG

If any shareholder proposes to sell or transfer shares (the "Transfer Shares"), all remaining shareholders shall have the right to make an offer for all or a portion of the Transfer Shares on a pro rata basis.

In the event of (i) a proposed sale or transfer of shares by any holder of Preferred Shares and/or (ii) a proposed transaction transferring {{control_transfer_pct}}% or more of the Company's voting power, each Investor and each Founder shall have the right to participate in such sale on a pro rata basis.

12. BOARD OF DIRECTORS

At initial Closing, the Board shall consist of {{board_size}} Directors: {{board_investor_seats}} investor-designated and {{board_founder_seats}} founder-designated.

13. DRAG-ALONG

All shareholders shall agree to sell and vote their shares in favor of a Liquidation Event or a transaction transferring 100% of the Company's shares approved by (i) the Board and (ii) at least {{drag_along_threshold_pct}}% of Common and Preferred Shares (on an as-converted basis) voting together (the "Eligible Holders").

14. LIQUIDITY RIGHTS

Upon written notice to the Company by holders of at least {{liquidity_trigger_pct}}% of Preferred Shares, the Company shall initiate a process to provide a liquidity opportunity for Investors seven (7) years after the Closing Date (the "Liquidity Right").

From year seven (7) to year ten (10) after Closing, the Company shall engage a reputable investment bank to identify a suitable exit opportunity. If no liquidity event has occurred by year ten (10), shareholders shall commit to offer at least a {{demand_sale_pct}}% stake in the Company (a "Demand Sale"), subject to minimum returns equivalent to an annual IRR of {{liquidity_irr_pct}}% or {{liquidity_multiple}} times the Original Purchase Price.

15. OTHER MATTERS

Sale Restriction: While Preferred Shares remain outstanding, Founders may not transfer any Company shares without Investor consent, except transfers to affiliates and other permitted transferees.

Confidentiality: The Company shall not disclose the terms of this Term Sheet without written consent of the lead Investor, except to officers, Board members, accountants, lawyers, and other acceptable prospective investors.

Expiration Date: This Term Sheet shall remain valid for {{term_sheet_validity_months}} months.`;
