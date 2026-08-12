-- Align findings risk levels with the firm DD playbook traffic light
-- (High / Medium / Low / Information required).

alter table public.findings
  drop constraint if exists findings_risk_level_check;

alter table public.findings
  add constraint findings_risk_level_check
  check (risk_level in ('bajo', 'medio', 'alto', 'info_requerida'));
