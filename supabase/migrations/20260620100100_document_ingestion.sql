-- Document ingestion, storage, and tenant isolation foundation.
-- Raw source files are stored under private/{user_id}/{document_id}/{filename}.

create extension if not exists pgcrypto;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'document_sources',
  'document_sources',
  false,
  52428800,
  array[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/html',
    'application/xhtml+xml'
  ]
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  google_api_key text,
  embedding_model_name text not null default 'gemini-embedding-001',
  pinecone_key text,
  pinecone_environment text,
  pinecone_index_name text,
  langsmith_key text,
  mcp_config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  filename text not null,
  file_type text not null,
  mime_type text not null,
  storage_bucket text not null default 'document_sources',
  storage_path text not null,
  file_size_bytes bigint not null,
  status text not null default 'UPLOADED',
  markdown_content text,
  failure_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint documents_status_check check (
    status in ('UPLOADED', 'QUEUED', 'PARSING', 'CHUNKING', 'EMBEDDING', 'STORING', 'STORED', 'FAILED')
  ),
  constraint documents_file_type_check check (file_type in ('PDF', 'DOCX', 'PPTX', 'HTML'))
);

create table if not exists public.document_jobs (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  status text not null default 'QUEUED',
  progress_percentage integer not null default 0,
  current_step_details text not null default 'Queued for ingestion.',
  attempts integer not null default 0,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint document_jobs_progress_check check (progress_percentage >= 0 and progress_percentage <= 100)
);

create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_text text not null,
  chunk_index integer not null,
  token_estimate integer not null default 0,
  created_at timestamptz not null default now(),
  unique (document_id, chunk_index)
);

create index if not exists documents_user_created_idx on public.documents (user_id, created_at desc);
create index if not exists document_jobs_document_idx on public.document_jobs (document_id);
create index if not exists document_chunks_document_order_idx on public.document_chunks (document_id, chunk_index);

alter table public.user_settings enable row level security;
alter table public.documents enable row level security;
alter table public.document_jobs enable row level security;
alter table public.document_chunks enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own"
  on public.user_settings for select
  using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own"
  on public.user_settings for insert
  with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own"
  on public.user_settings for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "documents_select_own" on public.documents;
create policy "documents_select_own"
  on public.documents for select
  using (auth.uid() = user_id);

drop policy if exists "documents_insert_own" on public.documents;
create policy "documents_insert_own"
  on public.documents for insert
  with check (auth.uid() = user_id);

drop policy if exists "documents_update_own" on public.documents;
create policy "documents_update_own"
  on public.documents for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "documents_delete_own" on public.documents;
create policy "documents_delete_own"
  on public.documents for delete
  using (auth.uid() = user_id);

drop policy if exists "document_jobs_select_own" on public.document_jobs;
create policy "document_jobs_select_own"
  on public.document_jobs for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_jobs.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_jobs_insert_own" on public.document_jobs;
create policy "document_jobs_insert_own"
  on public.document_jobs for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = document_jobs.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_jobs_update_own" on public.document_jobs;
create policy "document_jobs_update_own"
  on public.document_jobs for update
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_jobs.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_chunks_select_own" on public.document_chunks;
create policy "document_chunks_select_own"
  on public.document_chunks for select
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_chunks_insert_own" on public.document_chunks;
create policy "document_chunks_insert_own"
  on public.document_chunks for insert
  with check (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_chunks_delete_own" on public.document_chunks;
create policy "document_chunks_delete_own"
  on public.document_chunks for delete
  using (
    exists (
      select 1 from public.documents
      where documents.id = document_chunks.document_id
        and documents.user_id = auth.uid()
    )
  );

drop policy if exists "document_sources_select_own" on storage.objects;
create policy "document_sources_select_own"
  on storage.objects for select
  using (
    bucket_id = 'document_sources'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

drop policy if exists "document_sources_insert_own" on storage.objects;
create policy "document_sources_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'document_sources'
    and (storage.foldername(name))[1] = 'private'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

drop policy if exists "document_sources_update_own" on storage.objects;
create policy "document_sources_update_own"
  on storage.objects for update
  using (
    bucket_id = 'document_sources'
    and auth.uid()::text = (storage.foldername(name))[2]
  );

drop policy if exists "document_sources_delete_own" on storage.objects;
create policy "document_sources_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'document_sources'
    and auth.uid()::text = (storage.foldername(name))[2]
  );
