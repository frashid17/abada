-- Deduplicate founder profiles that share the same email (keeps the active account).
-- Prevents ambiguous founder lookup when multiple profile rows exist for one email.

with dup_emails as (
  select lower(email) as email_key
  from public.profiles
  where context = 'founder'
    and email is not null
  group by lower(email)
  having count(*) > 1
),
ranked as (
  select
    p.id,
    row_number() over (
      partition by lower(p.email)
      order by
        exists (
          select 1
          from public.documents d
          where d.owner_sub = p.clerk_user_id
        ) desc,
        exists (
          select 1
          from public.reviews r
          where r.requester_sub = p.clerk_user_id
        ) desc,
        exists (
          select 1
          from public.deal_participants dp
          where dp.participant_sub = p.clerk_user_id
            and dp.role = 'target'
        ) desc,
        p.updated_at desc,
        p.created_at desc
    ) as rn
  from public.profiles p
  inner join dup_emails d on lower(p.email) = d.email_key
  where p.context = 'founder'
)
update public.profiles
set
  email = null,
  updated_at = now()
where id in (select id from ranked where rn > 1);

create unique index if not exists profiles_founder_email_unique_idx
  on public.profiles (lower(email))
  where context = 'founder' and email is not null;
