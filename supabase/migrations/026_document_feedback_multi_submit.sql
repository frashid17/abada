-- Allow multiple feedback submissions per user/document (form every download).
alter table public.document_download_feedback
  drop constraint if exists document_download_feedback_owner_sub_document_type_key;

create index if not exists document_download_feedback_owner_type_created_idx
  on public.document_download_feedback (owner_sub, document_type, created_at desc);
