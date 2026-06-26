/** Server-only English employment template */
export const employmentMasterTemplateEn = `EMPLOYMENT AGREEMENT

Between:

(1) {{company_name}}, identified with Tax ID (NIT) {{company_id}}, hereinafter the "Employer"; and

(2) {{employee_name}}, identified with {{employee_id}}, email {{employee_email}}, hereinafter the "Employee";

this employment agreement is entered into under Colombian labor law.

1. ROLE AND DUTIES

The Employee shall serve as {{role_title}}, performing duties inherent to the role and other reasonable duties assigned by the Employer related to the corporate purpose.

2. START DATE

Employment begins on {{start_date}}.

3. TERM

{{contract_clause}}

4. COMPENSATION

Monthly salary: {{salary_monthly_cop}} COP, payable in accordance with applicable law.

5. WORKING HOURS AND LOCATION

Ordinary working hours under applicable law. The Employee may work on-site or remotely per Employer policies and role requirements.

6. CONFIDENTIALITY

The Employee shall maintain confidentiality of the Employer's commercial, technical, financial, and strategic information during and after employment.

7. INTELLECTUAL PROPERTY

All creations developed under this agreement belong to the Employer, under applicable law and assignment agreements.

8. NON-COMPETE

{{non_compete_clause}}

9. TERMINATION

Legal grounds for termination of employment under Colombian labor law apply.

10. GOVERNING LAW

Colombian labor law. Jurisdiction: {{jurisdiction_city}}.`;

export const employmentIndefiniteEn =
  "Indefinite-term employment contract, under Article 47 of the Colombian Labor Code.";

export const employmentFixedTermEn = (months: string) =>
  `Fixed-term contract for ${months} month(s), renewable in accordance with applicable law.`;

export const employmentNonCompeteNoneEn =
  "No post-employment non-compete clause is agreed in this draft.";

export const employmentNonCompeteCompensatedEn =
  "A post-employment non-compete clause with specific economic compensation may be agreed, subject to validation of scope and amount by the firm's attorneys.";
