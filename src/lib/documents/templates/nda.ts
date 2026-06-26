/** Server-only master template — never import from client components. */
export const ndaMasterTemplate = `ACUERDO DE CONFIDENCIALIDAD {{agreement_mode_label}}

Entre los suscritos:

(1) {{company_name}}, identificada con NIT {{company_id}}, en adelante "{{party_a_label}}"; y

(2) {{counterparty_name}}, identificada con {{counterparty_id}}, en adelante "{{party_b_label}}";

{{party_a_label}} y {{party_b_label}} se denominarán conjuntamente las "Partes" y cada una, individualmente, una "Parte".

1. OBJETO

Las Partes desean evaluar una posible relación comercial o de inversión relacionada con: {{purpose}} (el "Propósito"). En conexión con el Propósito, una o ambas Partes podrán revelar Información Confidencial a la otra.

2. INFORMACIÓN CONFIDENCIAL

"Información Confidencial" significa toda información no pública, en cualquier forma, revelada por una Parte a la otra en relación con el Propósito, incluyendo información financiera, comercial, técnica, de propiedad intelectual, listas de clientes, modelos de negocio, proyecciones y cualquier información derivada o resumen de la anterior.

3. OBLIGACIONES DE CONFIDENCIALIDAD

{{confidentiality_obligations}}

4. EXCEPCIONES

Las obligaciones anteriores no aplican a información que: (a) sea o pase a ser de dominio público sin incumplimiento de este acuerdo; (b) estuviera legítimamente en posesión del receptor antes de la revelación; (c) sea recibida de un tercero sin restricción y sin violación de deber de confidencialidad; o (d) deba divulgarse por mandato legal o autoridad competente, previa notificación razonable a la Parte reveladora cuando la ley lo permita.

5. PLAZO

Este acuerdo tendrá vigencia por {{term_years}} año(s) contados a partir de la fecha de firma. Las obligaciones de confidencialidad sobrevivirán por el mismo plazo respecto de la Información Confidencial revelada durante la vigencia.

6. DEVOLUCIÓN O DESTRUCCIÓN

A solicitud de la Parte reveladora, el receptor destruirá o devolverá la Información Confidencial y certificará su cumplimiento, salvo copias de respaldo retenidas por obligación legal o política interna de cumplimiento.

7. PROPIEDAD INTELECTUAL

Nada en este acuerdo otorga licencia ni transferencia de derechos de propiedad intelectual. Toda Información Confidencial permanece propiedad de la Parte reveladora.

8. LEY APLICABLE Y JURISDICCIÓN

Este acuerdo se regirá por las leyes de la República de Colombia. Las Partes se someten a los jueces de la ciudad de {{jurisdiction_city}}.

9. DISPOSICIONES GENERALES

Este acuerdo constituye el entendimiento completo entre las Partes respecto de su objeto. Cualquier modificación deberá constar por escrito firmada por ambas Partes. Si alguna disposición fuere inválida, las demás permanecerán vigentes.

En constancia, se firma en dos (2) ejemplares del mismo tenor, en {{jurisdiction_city}}, a los ___ días del mes de _________ de 20___.

___________________________          ___________________________
{{company_name}}                     {{counterparty_name}}
Representante legal                  Representante / apoderado`;

export const ndaMutualObligations = `Cada Parte se compromete a: (a) usar la Información Confidencial únicamente para el Propósito; (b) protegerla con el mismo grado de cuidado que aplica a su propia información confidencial, y en todo caso no inferior al cuidado razonable; (c) no divulgarla a terceros sin consentimiento previo y por escrito de la Parte reveladora, salvo a asesores sujetos a obligaciones equivalentes; y (d) limitar el acceso interno al personal que necesite conocerla para el Propósito.`;

export const ndaUnilateralObligations = `La Parte receptora se compromete a: (a) usar la Información Confidencial únicamente para el Propósito; (b) protegerla con el mismo grado de cuidado que aplica a su propia información confidencial, y en todo caso no inferior al cuidado razonable; (c) no divulgarla a terceros sin consentimiento previo y por escrito de la Parte reveladora, salvo a asesores sujetos a obligaciones equivalentes; y (d) limitar el acceso interno al personal que necesite conocerla para el Propósito.`;
