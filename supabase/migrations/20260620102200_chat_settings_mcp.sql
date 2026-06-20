-- Chat, encrypted settings, observability, and MCP configuration.

alter table public.user_settings
  drop column if exists google_api_key,
  drop column if exists pinecone_key,
  drop column if exists pinecone_environment,
  drop column if exists langsmith_key,
  drop column if exists mcp_config,
  add column if not exists google_api_key_encrypted text,
  add column if not exists pinecone_api_key_encrypted text,
  add column if not exists pinecone_host text,
  add column if not exists langsmith_api_key_encrypted text;

create table if not exists public.chat_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Untitled analysis session',
  summary text,
  selected_model text not null default 'gemini-1.5-flash',
  thinking_level text not null default 'fast',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chat_sessions_model_check check (selected_model in ('gemini-1.5-flash', 'gemini-1.5-pro')),
  constraint chat_sessions_thinking_check check (thinking_level in ('fast', 'deep', 'extensive'))
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chat_sessions(id) on delete cascade,
  role text not null,
  content text not null,
  sequence_number integer not null,
  status text not null default 'complete',
  event_log jsonb not null default '[]'::jsonb,
  tool_calls jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  constraint messages_role_check check (role in ('user', 'assistant', 'system', 'tool')),
  constraint messages_status_check check (status in ('complete', 'failed')),
  unique (session_id, sequence_number)
);

create table if not exists public.mcp_servers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  endpoint_url text not null,
  encrypted_headers text,
  status text not null default 'configured',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists chat_sessions_user_updated_idx on public.chat_sessions (user_id, updated_at desc);
create index if not exists messages_session_sequence_idx on public.messages (session_id, sequence_number);
create index if not exists mcp_servers_user_created_idx on public.mcp_servers (user_id, created_at);

alter table public.chat_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.mcp_servers enable row level security;

drop policy if exists "chat_sessions_select_own" on public.chat_sessions;
create policy "chat_sessions_select_own"
  on public.chat_sessions for select
  using (auth.uid() = user_id);

drop policy if exists "chat_sessions_insert_own" on public.chat_sessions;
create policy "chat_sessions_insert_own"
  on public.chat_sessions for insert
  with check (auth.uid() = user_id);

drop policy if exists "chat_sessions_update_own" on public.chat_sessions;
create policy "chat_sessions_update_own"
  on public.chat_sessions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "chat_sessions_delete_own" on public.chat_sessions;
create policy "chat_sessions_delete_own"
  on public.chat_sessions for delete
  using (auth.uid() = user_id);

drop policy if exists "messages_select_own" on public.messages;
create policy "messages_select_own"
  on public.messages for select
  using (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

drop policy if exists "messages_insert_own" on public.messages;
create policy "messages_insert_own"
  on public.messages for insert
  with check (
    exists (
      select 1 from public.chat_sessions
      where chat_sessions.id = messages.session_id
        and chat_sessions.user_id = auth.uid()
    )
  );

drop policy if exists "mcp_servers_select_own" on public.mcp_servers;
create policy "mcp_servers_select_own"
  on public.mcp_servers for select
  using (auth.uid() = user_id);

drop policy if exists "mcp_servers_insert_own" on public.mcp_servers;
create policy "mcp_servers_insert_own"
  on public.mcp_servers for insert
  with check (auth.uid() = user_id);

drop policy if exists "mcp_servers_update_own" on public.mcp_servers;
create policy "mcp_servers_update_own"
  on public.mcp_servers for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "mcp_servers_delete_own" on public.mcp_servers;
create policy "mcp_servers_delete_own"
  on public.mcp_servers for delete
  using (auth.uid() = user_id);
