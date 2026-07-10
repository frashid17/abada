-- M7 prep: platform-wide legal corpus (Colombian statutes, codes, circulars)
-- Not tenant-scoped — shared grounding layer for AI retrieval across all firms.

create table public.legal_sources (
  id text primary key,
  corpus_id text,
  source_type text not null check (source_type in ('constitution', 'code', 'statute', 'decree', 'circular', 'decision')),
  jurisdiction text not null default 'CO',
  citation_es text not null,
  citation_en text not null,
  title_es text not null,
  title_en text not null,
  description_es text,
  description_en text,
  pdf_filename text,
  chunk_count int not null default 0,
  status text not null default 'pending' check (status in ('pending', 'extracted', 'indexed')),
  extracted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index legal_sources_corpus_id_idx on public.legal_sources (corpus_id);
create index legal_sources_source_type_idx on public.legal_sources (source_type);

create table public.legal_source_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id text not null references public.legal_sources (id) on delete cascade,
  locale text not null check (locale in ('es-CO', 'en-US')),
  chunk_index int not null,
  article_ref text not null,
  heading text not null,
  content text not null,
  translation_status text not null default 'official'
    check (translation_status in ('official', 'pending', 'reviewed')),
  -- Populated by trigger (per-row language config is not allowed in a generated column)
  content_tsv tsvector,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (source_id, locale, chunk_index)
);

create index legal_source_chunks_source_id_idx on public.legal_source_chunks (source_id);
create index legal_source_chunks_locale_idx on public.legal_source_chunks (locale);
create index legal_source_chunks_content_tsv_idx on public.legal_source_chunks using gin (content_tsv);

create or replace function public.legal_source_chunks_tsv_update()
returns trigger
language plpgsql
as $$
begin
  new.content_tsv := to_tsvector(
    (case when new.locale = 'en-US' then 'english' else 'spanish' end)::regconfig,
    coalesce(new.article_ref, '') || ' ' || coalesce(new.heading, '') || ' ' || coalesce(new.content, '')
  );
  return new;
end;
$$;

create trigger legal_source_chunks_tsv_trigger
  before insert or update of article_ref, heading, content, locale
  on public.legal_source_chunks
  for each row
  execute function public.legal_source_chunks_tsv_update();

alter table public.legal_sources enable row level security;
alter table public.legal_source_chunks enable row level security;

-- Authenticated users may read the platform legal corpus (grounding only — server-side)
create policy "legal_sources_read_authenticated"
  on public.legal_sources for select
  to authenticated
  using (true);

create policy "legal_source_chunks_read_authenticated"
  on public.legal_source_chunks for select
  to authenticated
  using (true);

-- Service role handles ingestion (no direct client writes)
create policy "legal_sources_service_role"
  on public.legal_sources for all
  to service_role
  using (true)
  with check (true);

create policy "legal_source_chunks_service_role"
  on public.legal_source_chunks for all
  to service_role
  using (true)
  with check (true);

create or replace function public.search_legal_corpus(
  p_query text,
  p_locale text default 'es-CO',
  p_limit int default 12
)
returns table (
  id uuid,
  source_id text,
  locale text,
  article_ref text,
  heading text,
  content text,
  citation text,
  title text,
  rank real
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.source_id,
    c.locale,
    c.article_ref,
    c.heading,
    c.content,
    case when p_locale = 'en-US' then s.citation_en else s.citation_es end as citation,
    case when p_locale = 'en-US' then s.title_en else s.title_es end as title,
    ts_rank(c.content_tsv, plainto_tsquery(
      (case when p_locale = 'en-US' then 'english' else 'spanish' end)::regconfig,
      p_query
    )) as rank
  from public.legal_source_chunks c
  join public.legal_sources s on s.id = c.source_id
  where c.locale = p_locale
    and c.content_tsv @@ plainto_tsquery(
      (case when p_locale = 'en-US' then 'english' else 'spanish' end)::regconfig,
      p_query
    )
  order by rank desc
  limit p_limit;
$$;

grant execute on function public.search_legal_corpus(text, text, int) to authenticated;
grant execute on function public.search_legal_corpus(text, text, int) to service_role;
