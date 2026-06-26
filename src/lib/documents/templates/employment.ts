/** Server-only master template */
export const employmentMasterTemplate = `CONTRATO DE TRABAJO

Entre:

(1) {{company_name}}, identificada con NIT {{company_id}}, en adelante el "Empleador"; y

(2) {{employee_name}}, identificado(a) con {{employee_id}}, correo {{employee_email}}, en adelante el "Trabajador";

se celebra el presente contrato de trabajo conforme a la legislación laboral colombiana.

1. CARGO Y FUNCIONES

El Trabajador desempeñará el cargo de {{role_title}}, con las funciones propias del cargo y las que razonablemente le asigne el Empleador vinculadas al objeto social.

2. FECHA DE INICIO

El contrato inicia el {{start_date}}.

3. TIPO Y PLAZO

{{contract_clause}}

4. REMUNERACIÓN

Salario mensual: {{salary_monthly_cop}} COP, pagadero en los términos de ley.

5. JORNADA Y LUGAR DE TRABAJO

Jornada ordinaria conforme a la ley. El Trabajador podrá prestar servicios de forma presencial o remota según políticas del Empleador y necesidades del cargo.

6. CONFIDENCIALIDAD

El Trabajador mantendrá confidencialidad sobre información comercial, técnica, financiera y estratégica del Empleador, durante la relación y después de terminada.

7. PROPIEDAD INTELECTUAL

Toda creación desarrollada en el marco del contrato pertenece al Empleador, conforme a la ley y acuerdos de cesión aplicables.

8. CLÁUSULA DE NO COMPETENCIA

{{non_compete_clause}}

9. TERMINACIÓN

Aplican las causales legales de terminación del contrato de trabajo en Colombia.

10. LEY APLICABLE

Legislación laboral colombiana. Jurisdicción: {{jurisdiction_city}}.

En constancia, se firma en {{jurisdiction_city}}, a los ___ días del mes de _________ de 20___.

Por el Empleador:                        El Trabajador:

___________________________              ___________________________
{{company_representative}}               {{employee_name}}`;

export const employmentIndefinite =
  "Contrato a término indefinido, conforme al artículo 47 del Código Sustantivo del Trabajo.";

export const employmentFixedTerm = (months: string) =>
  `Contrato a término fijo por ${months} mes(es), prorrogable conforme a la ley.`;

export const employmentNonCompeteNone =
  "No se pacta cláusula de no competencia post-contractual.";

export const employmentNonCompeteCompensated =
  "Se podrá pactar cláusula de no competencia post-contractual con compensación económica específica, conforme a la jurisprudencia de la Corte Suprema de Justicia — la firma validará el monto y alcance en revisión.";
