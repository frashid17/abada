/** Server-only master template — never import from client components. */
export const vestingMasterTemplate = `ACUERDO DE VESTING DE FUNDADOR

Entre:

(1) {{company_name}}, sociedad identificada con NIT {{company_id}}, en adelante la "Compañía"; y

(2) {{founder_name}}, identificado(a) con {{founder_id}}, correo {{founder_email}}, en adelante el "Fundador";

la Compañía y el Fundador se denominan conjuntamente las "Partes".

1. ANTECEDENTES

El Fundador es accionista de la Compañía y desea formalizar un régimen de adquisición gradual de derechos sobre {{shares_total}} acciones (las "Acciones Sujetas a Vesting"), conforme a los términos de este acuerdo.

2. RÉGIMEN DE VESTING

2.1. Las Acciones Sujetas a Vesting se adquirirán de forma lineal durante {{vesting_months}} meses, contados a partir del {{vesting_start_date}} (la "Fecha de Inicio").

2.2. Período de cliff: durante los primeros {{cliff_months}} meses no se adquirirá derecho alguno sobre las Acciones Sujetas a Vesting. Al cumplirse el cliff, el Fundador habrá adquirido derecho sobre la proporción correspondiente al período transcurrido conforme al calendario lineal.

2.3. Calendario: salvo aceleración conforme a la Sección 3, el derecho sobre las Acciones Sujetas a Vesting se devengará mensualmente de manera proporcional después del cliff.

3. ACELERACIÓN

{{acceleration_clause}}

4. SEPARACIÓN DEL FUNDADOR

{{departure_clause}}

5. RESTRICCIONES Y TRANSFERENCIA

Hasta que las Acciones Sujetas a Vesting se hayan adquirido en su totalidad, el Fundador no podrá enajenar, gravar ni transferir dichas acciones sin consentimiento previo y por escrito de la Compañía, salvo en los casos expresamente permitidos en el acuerdo de accionistas vigente.

6. BUEN SALIDOR

{{good_leaver_clause}}

7. DISPOSICIONES ADICIONALES

{{additional_terms_block}}

8. LEY APLICABLE

Este acuerdo se regirá por las leyes de la República de Colombia.

9. FIRMAS

En constancia, se firma en Bogotá D.C., a los ___ días del mes de _________ de 20___.

Por la Compañía:                         El Fundador:

___________________________              ___________________________
{{company_representative}}               {{founder_name}}
{{company_representative_title}}`;

export const vestingAccelerationNone =
  "No aplicará aceleración automática. El vesting continuará conforme al calendario de la Sección 2, salvo acuerdo escrito de las Partes.";

export const vestingAccelerationSingle =
  "Aceleración de un solo evento (single trigger): en caso de un Evento de Liquidez aprobado por la junta directiva, el cien por ciento (100%) de las Acciones Sujetas a Vesting no adquiridas se considerarán adquiridas de inmediato, sujeto a los términos del acuerdo de accionistas.";

export const vestingAccelerationDouble =
  "Aceleración de doble evento (double trigger): si ocurre un Cambio de Control y, dentro de los doce (12) meses siguientes, el Fundador es desvinculado sin Causa Justa, el cien por ciento (100%) de las Acciones Sujetas a Vesting no adquiridas se considerarán adquiridas de inmediato.";

export const vestingDepartureForfeit =
  "En caso de separación del Fundador por cualquier causa antes de completar el vesting, las Acciones Sujetas a Vesting no adquiridas revertirán a la Compañía sin contraprestación adicional, salvo lo dispuesto en el acuerdo de accionistas.";

export const vestingDeparturePartial =
  "En caso de separación del Fundador, las Acciones Sujetas a Vesting no adquiridas podrán ser recompradas por la Compañía a valor razonable determinado conforme al acuerdo de accionistas, considerando la causa de separación.";

export const vestingDepartureNegotiable =
  "En caso de separación del Fundador, el tratamiento de las Acciones Sujetas a Vesting no adquiridas se negociará de buena fe entre las Partes, considerando si la separación constituye Buen Salidor conforme a la Sección 6.";
