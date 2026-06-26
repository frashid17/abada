/** Server-only master template */
export const ipMasterTemplate = `ACUERDO DE CESIÓN DE PROPIEDAD INTELECTUAL

Entre:

(1) {{company_name}}, identificada con NIT {{company_id}}, en adelante la "Compañía"; y

(2) {{assignor_name}}, identificado(a) con {{assignor_id}}, correo {{assignor_email}}, en adelante el "Cedente";

la Compañía y el Cedente se denominan conjuntamente las "Partes".

1. ANTECEDENTES

El Cedente ha desarrollado o participado en el desarrollo de ciertos activos de propiedad intelectual en relación con el negocio de la Compañía. Las Partes desean formalizar la cesión de dichos derechos a favor de la Compañía.

2. OBJETO DE LA CESIÓN

{{scope_clause}}

Descripción de la propiedad intelectual objeto de cesión:
{{ip_description}}

3. CONTRAPRESTACIÓN

Como contraprestación por la presente cesión, el Cedente recibe: {{consideration}}.

4. GARANTÍAS DEL CEDENTE

El Cedente declara que: (a) es titular legítimo de los derechos cedidos o tiene facultad para cederlos; (b) los derechos no están gravados ni sujetos a restricciones de terceros que impidan la cesión; y (c) la cesión no infringe obligaciones previas con terceros.

5. OBRAS FUTURAS

Durante la relación con la Compañía, toda creación vinculada al objeto social o desarrollada con recursos de la Compañía se entenderá realizada por encargo y pertenecerá a la Compañía desde su creación, en los términos de la ley colombiana aplicable.

6. VIGENCIA

Este acuerdo rige a partir del {{effective_date}}.

7. LEY APLICABLE

Se regirá por las leyes de la República de Colombia. Jurisdicción: {{jurisdiction_city}}.

En constancia, se firma en {{jurisdiction_city}}, a los ___ días del mes de _________ de 20___.

Por la Compañía:                         El Cedente:

___________________________              ___________________________
Representante legal                      {{assignor_name}}`;

export const ipScopeAll =
  "El Cedente cede a la Compañía, de forma exclusiva, irrevocable y a título universal, todos los derechos patrimoniales de autor y demás derechos de propiedad intelectual sobre obras, invenciones, know-how, software, bases de datos, marcas, diseños y creaciones actuales y futuras vinculadas al negocio de la Compañía.";

export const ipScopeSpecified =
  "El Cedente cede a la Compañía, de forma exclusiva e irrevocable, los derechos patrimoniales de autor y demás derechos de propiedad intelectual únicamente sobre los activos descritos en la Sección 2.";
