create extension if not exists pgcrypto;

create or replace function public.is_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table public.artisans (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null,
  craft text not null,
  neighborhood text,
  bio text not null,
  quote text,
  portrait_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artisan_contacts (
  artisan_id uuid primary key references public.artisans(id) on delete cascade,
  email text,
  phone text,
  instagram text,
  public_email boolean not null default false,
  public_phone boolean not null default false,
  public_instagram boolean not null default true,
  updated_at timestamptz not null default now()
);

create table public.works (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  description text not null,
  materials text[] not null default '{}',
  year smallint check (year between 1900 and 2100),
  cover_url text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.artisan_categories (
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (artisan_id, category_id)
);

create table public.work_categories (
  work_id uuid not null references public.works(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  primary key (work_id, category_id)
);

create table public.artisan_media (
  id uuid primary key default gen_random_uuid(),
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  url text not null,
  alt_text text not null,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table public.work_media (
  id uuid primary key default gen_random_uuid(),
  work_id uuid not null references public.works(id) on delete cascade,
  url text not null,
  alt_text text not null,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default now()
);

create table public.artisan_submissions (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  craft text not null check (char_length(craft) between 2 and 120),
  neighborhood text,
  bio text not null check (char_length(bio) between 40 and 3000),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  phone text,
  instagram text,
  portrait_path text,
  consent boolean not null check (consent),
  status text not null default 'pending' check (status in ('pending','under_review','approved','rejected')),
  reviewer_notes text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.submission_works (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.artisan_submissions(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null check (char_length(description) between 10 and 2000),
  materials text[] not null default '{}',
  image_paths text[] not null default '{}',
  position smallint not null default 0 check (position between 0 and 2),
  unique (submission_id, position)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  subject text not null check (char_length(subject) between 2 and 160),
  message text not null check (char_length(message) between 10 and 3000),
  status text not null default 'new' check (status in ('new','read','resolved')),
  created_at timestamptz not null default now()
);

create table public.moderation_events (
  id bigint generated always as identity primary key,
  submission_id uuid references public.artisan_submissions(id) on delete set null,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index artisans_status_published_idx on public.artisans(status, published_at desc);
create index works_status_published_idx on public.works(status, published_at desc);
create index works_artisan_id_idx on public.works(artisan_id);
create index artisan_media_artisan_position_idx on public.artisan_media(artisan_id, position);
create index work_media_work_position_idx on public.work_media(work_id, position);
create index submissions_status_created_idx on public.artisan_submissions(status, created_at desc);
create index submission_works_submission_idx on public.submission_works(submission_id);
create index contact_messages_status_created_idx on public.contact_messages(status, created_at desc);
create index moderation_events_submission_idx on public.moderation_events(submission_id, created_at desc);

alter table public.categories enable row level security;
alter table public.artisans enable row level security;
alter table public.artisan_contacts enable row level security;
alter table public.works enable row level security;
alter table public.artisan_categories enable row level security;
alter table public.work_categories enable row level security;
alter table public.artisan_media enable row level security;
alter table public.work_media enable row level security;
alter table public.artisan_submissions enable row level security;
alter table public.submission_works enable row level security;
alter table public.contact_messages enable row level security;
alter table public.moderation_events enable row level security;

create policy categories_public_read on public.categories for select to anon, authenticated using (true);
create policy artisans_public_read on public.artisans for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy works_public_read on public.works for select to anon, authenticated using (status = 'published' or public.is_admin());
create policy artisan_categories_public_read on public.artisan_categories for select to anon, authenticated using (true);
create policy work_categories_public_read on public.work_categories for select to anon, authenticated using (true);
create policy artisan_media_public_read on public.artisan_media for select to anon, authenticated using (exists (select 1 from public.artisans a where a.id = artisan_id and (a.status = 'published' or public.is_admin())));
create policy work_media_public_read on public.work_media for select to anon, authenticated using (exists (select 1 from public.works w where w.id = work_id and (w.status = 'published' or public.is_admin())));

create policy submissions_public_insert on public.artisan_submissions for insert to anon, authenticated with check (status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy submission_works_public_insert on public.submission_works for insert to anon, authenticated with check (exists (select 1 from public.artisan_submissions s where s.id = submission_id and s.status = 'pending' and s.created_at > now() - interval '30 minutes'));
create policy contact_public_insert on public.contact_messages for insert to anon, authenticated with check (status = 'new');

create policy admin_categories_all on public.categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_artisans_all on public.artisans for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_contacts_all on public.artisan_contacts for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_works_all on public.works for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_artisan_categories_all on public.artisan_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_work_categories_all on public.work_categories for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_artisan_media_all on public.artisan_media for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_work_media_all on public.work_media for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_submissions_all on public.artisan_submissions for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_submission_works_all on public.submission_works for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_messages_all on public.contact_messages for all to authenticated using (public.is_admin()) with check (public.is_admin());
create policy admin_moderation_all on public.moderation_events for all to authenticated using (public.is_admin()) with check (public.is_admin());

revoke all on all tables in schema public from anon, authenticated;
grant usage on schema public to anon, authenticated;
grant select on public.categories, public.artisans, public.works, public.artisan_categories, public.work_categories, public.artisan_media, public.work_media to anon, authenticated;
grant select on public.artisan_contacts to authenticated;
grant insert on public.artisan_submissions, public.submission_works, public.contact_messages to anon, authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('public-media', 'public-media', true, 5242880, array['image/jpeg','image/png','image/webp']),
  ('submission-media', 'submission-media', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy public_media_read on storage.objects for select to anon, authenticated using (bucket_id = 'public-media');
create policy admin_public_media_all on storage.objects for all to authenticated using (bucket_id = 'public-media' and public.is_admin()) with check (bucket_id = 'public-media' and public.is_admin());
create policy submission_media_insert on storage.objects for insert to anon, authenticated with check (
  bucket_id = 'submission-media'
  and exists (
    select 1 from public.artisan_submissions s
    where s.id::text = (storage.foldername(name))[1]
      and s.status = 'pending'
      and s.created_at > now() - interval '30 minutes'
  )
);
create policy admin_submission_media_all on storage.objects for all to authenticated using (bucket_id = 'submission-media' and public.is_admin()) with check (bucket_id = 'submission-media' and public.is_admin());

insert into public.categories (slug, name, description) values
  ('ceramica', 'Cerâmica', 'Peças modeladas, queimadas e esmaltadas à mão.'),
  ('fibras', 'Fibras & tramas', 'Tecelagem, cestaria, crochê e bordado.'),
  ('madeira', 'Madeira', 'Entalhe, marcenaria e objetos utilitários.'),
  ('papel', 'Papel & impressão', 'Encadernação, gravura e experimentação gráfica.'),
  ('metal', 'Metal', 'Joalheria, ferragens e escultura artesanal.'),
  ('saberes', 'Saberes vivos', 'Práticas transmitidas entre gerações.')
on conflict (slug) do nothing;
