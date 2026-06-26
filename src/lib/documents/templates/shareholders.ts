/** Server-only master template — Acuerdo de Accionistas (Colombian VC MVP) */
export const shareholdersMasterTemplate = `ACUERDO DE ACCIONISTAS

Entre los Accionistas de {{company_name}}, sociedad identificada con NIT {{company_id}}, en adelante la "Compañía", y en especial el inversionista líder {{lead_investor_name}} ({{lead_investor_id}}), se celebra el presente Acuerdo de Accionistas con vigencia desde el {{effective_date}}.

1. OBJETO

Regular los derechos y obligaciones entre los Accionistas de la Compañía en el marco de una inversión de capital de riesgo en Colombia, incluyendo restricciones a la transferencia de acciones, mecanismos de arrastre y acompañamiento, protección contra dilución y reglas de gobierno corporativo.

2. RESTRICCIÓN A LA TRANSFERENCIA

Ningún Accionista podrá enajenar, gravar o transferir acciones sin cumplir el derecho de preferencia y las demás restricciones que adopte la asamblea de accionistas conforme a la ley y los estatutos.

3. DRAG-ALONG (ARRASTRE)

Si Accionistas que representen al menos el {{drag_along_threshold_pct}}% del capital social votan a favor de una venta de la Compañía o de sus activos sustancialmente totales, los demás Accionistas se obligan a votar y vender en las mismas condiciones económicas y legales, salvo disposición legal imperativa en contrario.

4. TAG-ALONG (ACOMPAÑAMIENTO)

{{tag_along_clause}}

5. ANTI-DILUCIÓN

{{anti_dilution_clause}}

6. DECISIONES DE ACCIONISTAS

Las decisiones reservadas a mayoría calificada requerirán el voto favorable de Accionistas que representen al menos el {{qualified_majority_pct}}% del capital social, incluyendo, de forma enunciativa: emisión de nuevas series, endeudamiento material fuera del curso ordinario, venta de activos esenciales, cambio de objeto social relevante y modificación de derechos preferenciales.

7. VESTING Y SALIDA DE FUNDADORES

El vesting de fundadores se regirá por el acuerdo de vesting celebrado con la Compañía y se incorporará por referencia a este acuerdo. La definición de buen/mal salidor se alineará con la práctica de capital de riesgo en Colombia y será validada por la firma en revisión.

8. CONFIDENCIALIDAD

Los términos económicos y estratégicos de este acuerdo son confidenciales, salvo divulgación requerida por ley, regulador o inversionistas con necesidad de conocer.

9. SOLUCIÓN DE CONTROVERSIAS

{{dispute_resolution_clause}}

10. LEY APLICABLE

Legislación colombiana. Jurisdicción y domicilio contractual: {{jurisdiction_city}}.

En constancia, se firma en {{jurisdiction_city}}, a los ___ días del mes de _________ de 20___.

Por la Compañía:

___________________________
{{company_representative}}
Representante legal`;

export const shareholdersTagAlongYes =
  "Si uno o más Accionistas mayoritarios venden acciones a un tercero, los Accionistas minoritarios tendrán derecho a participar en la venta en forma proporcional y en las mismas condiciones (tag-along), mediante notificación escrita dentro del plazo que señale la operación.";

export const shareholdersTagAlongNo =
  "No se pacta cláusula de tag-along en esta versión del borrador; la firma evaluará si conviene incorporarla según la negociación con el fondo.";

export const shareholdersAntiDilutionNone =
  "No se pacta ajuste anti-dilución en esta ronda. Las emisiones futuras se regirán por los estatutos y la ley.";

export const shareholdersAntiDilutionBroad =
  "Se adopta mecanismo de anti-dilución de promedio ponderado amplio (broad-based weighted average) para proteger a los inversionistas de esta ronda ante emisiones futuras a precio inferior, con la fórmula y excepciones que la firma consolide en revisión.";

export const shareholdersDisputeArbitration =
  "Las controversias se resolverán mediante arbitraje de derecho ante un centro de arbitraje reconocido en Colombia, con sede en la ciudad de domicilio contractual, conforme al reglamento aplicable.";

export const shareholdersDisputeCourts =
  "Las controversias se someterán a los jueces de la república colombiana competentes en el domicilio contractual, sin perjuicio de medidas cautelares urgentes.";
