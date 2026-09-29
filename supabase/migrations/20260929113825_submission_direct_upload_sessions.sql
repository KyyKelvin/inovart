-- Applied through the Supabase connector as migration version 20260929113825.
create table public.submission_upload_sessions (
  id uuid primary key,
  data jsonb not null,
  files jsonb not null,
  client_hash text not null check (client_hash ~ '^[a-f0-9]{64}$'),
  session_token_hash text not null check (session_token_hash ~ '^[a-f0-9]{64}$'),
  state text not null default 'prepared' check (state in ('prepared', 'processing')),
  expires_at timestamptz not null default (now() + interval '2 hours'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (jsonb_typeof(data) = 'object'),
  check (jsonb_typeof(files) = 'array' and jsonb_array_length(files) <= 7)
);

alter table public.submission_upload_sessions enable row level security;

revoke all on public.submission_upload_sessions from public, anon, authenticated;
grant select, insert, update, delete on public.submission_upload_sessions to service_role;

create index submission_upload_sessions_expiry_idx
  on public.submission_upload_sessions (expires_at);
