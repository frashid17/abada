-- M6: seed knowledge hub articles (KH-01..KH-10) for the firm tenant.

do $$
declare
  v_tenant_id uuid;
begin
  select id into v_tenant_id
  from public.tenants
  where name = 'Balam Legal'
  limit 1;

  if v_tenant_id is null then
    select id into v_tenant_id
    from public.tenants
    order by created_at asc
    limit 1;
  end if;

  if v_tenant_id is null then
    return;
  end if;

  insert into public.knowledge_hub_articles (
    tenant_id, slug, title, excerpt, body, status, published_at
  ) values
    (
      v_tenant_id,
      'documentos-legales-antes-de-inversion',
      '¿Qué documentos legales debes tener antes de buscar inversión?',
      'Los cinco documentos que los fondos colombianos esperan ver antes de una ronda.',
      'Antes de abrir una sala de datos, los inversionistas revisan acuerdo de accionistas, vesting, cesión de PI, contratos laborales y, cuando aplica, un NDA mutuo.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'acuerdo-de-accionistas-base-ronda',
      'Acuerdo de accionistas: la base de toda ronda de inversión',
      'Por qué el pacto societario es el primer documento que revisa un fondo.',
      'El acuerdo de accionistas define gobierno, transferencias, arrastre y tag-along. Un borrador investment-ready acelera la negociación del term sheet.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'vesting-para-fundadores',
      'Vesting para fundadores: por qué los inversionistas lo exigen',
      'Alineación de incentivos y protección del fondo ante salidas tempranas.',
      'El vesting asegura que los fundadores ganen su equity con el tiempo. Los fondos suelen pedir cliff de 12 meses y un horizonte de 4 años.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'propiedad-intelectual-empresa',
      'Cómo asegurar que tu empresa sea dueña de su propiedad intelectual',
      'Cesiones, trabajos por encargo y código desarrollado por terceros.',
      'Los fondos verifican que software, marca y contenido estén cedidos a la sociedad. Una cesión de PI completa evita hallazgos críticos en due diligence.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'contratos-laborales-inversion',
      'Contratos laborales listos para inversión: lo que los inversionistas revisan',
      'Cláusulas de confidencialidad, PI laboral y no competencia razonable.',
      'Los fondos revisan plantillas de contratación para confirmar obligaciones claras con empleados clave y capacidad de escalar el equipo.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'nda-mutuo-inversionista',
      'Cuándo y cómo usar un NDA mutuo con un inversionista',
      'Protege información sensible sin frenar la conversación comercial.',
      'Un NDA mutuo equilibrado permite compartir métricas, cap table y roadmap con confianza. Define propósito, plazo y excepciones estándar.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'errores-legales-antes-levantar-capital',
      'Los 5 errores legales más comunes antes de levantar capital',
      'Cap table, PI, laboral, pacto societario y data room desordenada.',
      'Corregir cap table, PI, contratos laborales, NDA y taxonomía de data room antes del proceso reduce semanas de fricción con el fondo.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'due-diligence-que-esperar',
      'Due diligence: qué esperar cuando un fondo te invita a un proceso',
      'Del NDA a la evaluación ejecutiva en venture en Colombia.',
      'El fondo abre una sala de datos por categoría de riesgo. La firma publica hallazgos y una evaluación ejecutiva que los inversionistas priorizan.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'cap-table-limpia-ronda-semilla',
      'Cap table limpia: cómo prepararte para una ronda semilla',
      'Estructura accionaria clara antes de negociar valuación.',
      'Una cap table ordenada muestra titularidad real, vesting y side letters. Alinea el acuerdo de accionistas con la cap table exportada.',
      'published',
      now()
    ),
    (
      v_tenant_id,
      'cuando-necesitas-abogado',
      'Cuándo necesitas un abogado y cuándo puedes hacerlo solo',
      'Dónde la plataforma acelera y dónde la revisión nombrada es indispensable.',
      'Abada ayuda a redactar borradores investment-ready, pero cada documento con relevancia legal para una ronda debe ser revisado por un abogado nombrado de la firma.',
      'published',
      now()
    )
  on conflict (tenant_id, slug) do update set
    title = excluded.title,
    excerpt = excluded.excerpt,
    body = excluded.body,
    status = excluded.status,
    published_at = excluded.published_at,
    updated_at = now();
end $$;
