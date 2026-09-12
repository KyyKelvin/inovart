-- Applied to test-artesao / fpjxixijldymlkajenck as migration 20260912191350.
-- Adds lease-based, service-only cleanup and prevents deletion of still-referenced public media.
alter table private.media_cleanup_queue
  add column if not exists bucket_id text not null default 'public-media',
  add column if not exists available_at timestamptz not null default now(),
  add column if not exists lease_token uuid,
  add column if not exists lease_expires_at timestamptz;

alter table private.media_cleanup_queue
  drop constraint if exists media_cleanup_queue_bucket_id_check,
  add constraint media_cleanup_queue_bucket_id_check check (bucket_id = 'public-media'),
  drop constraint if exists media_cleanup_queue_lease_pair_check,
  add constraint media_cleanup_queue_lease_pair_check
    check ((lease_token is null) = (lease_expires_at is null));

create index if not exists media_cleanup_queue_claim_idx
  on private.media_cleanup_queue (available_at, lease_expires_at, attempts, created_at);

revoke all on private.media_cleanup_queue from public, anon, authenticated, service_role;
revoke all on sequence private.media_cleanup_queue_id_seq from public, anon, authenticated, service_role;

create or replace function private.public_media_object_path(p_url text)
returns text
language sql
immutable
returns null on null input
set search_path = ''
as $$
  select case
    when position('/storage/v1/object/public/public-media/' in p_url) > 0
      then split_part(split_part(p_url, '/storage/v1/object/public/public-media/', 2), '?', 1)
    else null
  end
$$;
revoke all on function private.public_media_object_path(text) from public, anon, authenticated, service_role;

create or replace function private.public_media_path_is_referenced(p_path text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.artisans a
      where private.public_media_object_path(a.portrait_url) = p_path
    union all
    select 1 from public.works w
      where private.public_media_object_path(w.cover_url) = p_path
    union all
    select 1 from public.artisan_media am
      where private.public_media_object_path(am.url) = p_path
    union all
    select 1 from public.work_media wm
      where private.public_media_object_path(wm.url) = p_path
  )
$$;
revoke all on function private.public_media_path_is_referenced(text) from public, anon, authenticated, service_role;

create or replace function private.queue_replaced_public_media()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  old_url text;
  new_url text;
  queued_path text;
  record_id uuid;
begin
  if tg_table_schema <> 'public' then
    raise exception 'Unexpected trigger source';
  end if;

  if tg_table_name = 'artisans' then
    old_url := old.portrait_url;
    record_id := old.id;
    if tg_op = 'UPDATE' then new_url := new.portrait_url; end if;
  elsif tg_table_name = 'works' then
    old_url := old.cover_url;
    record_id := old.id;
    if tg_op = 'UPDATE' then new_url := new.cover_url; end if;
  elsif tg_table_name = 'artisan_media' then
    old_url := old.url;
    record_id := old.artisan_id;
    if tg_op = 'UPDATE' then new_url := new.url; end if;
  elsif tg_table_name = 'work_media' then
    old_url := old.url;
    record_id := old.work_id;
    if tg_op = 'UPDATE' then new_url := new.url; end if;
  else
    raise exception 'Unexpected trigger table';
  end if;

  if old_url is distinct from new_url then
    queued_path := private.public_media_object_path(old_url);
    if queued_path is not null
       and char_length(queued_path) between 1 and 1024
       and queued_path !~ '(^|/)\.\.?(/|$)'
       and not private.public_media_path_is_referenced(queued_path) then
      insert into private.media_cleanup_queue(
        bucket_id, object_path, source_table, source_id, available_at
      )
      values('public-media', queued_path, tg_table_name, record_id, now())
      on conflict(object_path) do update set
        source_table = excluded.source_table,
        source_id = excluded.source_id,
        available_at = least(private.media_cleanup_queue.available_at, now()),
        last_error = null,
        updated_at = now();
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end
$$;
revoke all on function private.queue_replaced_public_media() from public, anon, authenticated, service_role;

drop trigger if exists queue_artisan_portrait_update on public.artisans;
drop trigger if exists queue_artisan_portrait_delete on public.artisans;
drop trigger if exists queue_work_cover_update on public.works;
drop trigger if exists queue_work_cover_delete on public.works;
drop trigger if exists queue_artisan_media_update on public.artisan_media;
drop trigger if exists queue_artisan_media_delete on public.artisan_media;
drop trigger if exists queue_work_media_update on public.work_media;
drop trigger if exists queue_work_media_delete on public.work_media;

drop trigger if exists queue_artisan_media_cleanup on public.artisans;
create constraint trigger queue_artisan_media_cleanup
after update or delete on public.artisans
deferrable initially deferred
for each row execute function private.queue_replaced_public_media();

drop trigger if exists queue_work_media_cleanup on public.works;
create constraint trigger queue_work_media_cleanup
after update or delete on public.works
deferrable initially deferred
for each row execute function private.queue_replaced_public_media();

drop trigger if exists queue_artisan_gallery_cleanup on public.artisan_media;
create constraint trigger queue_artisan_gallery_cleanup
after update or delete on public.artisan_media
deferrable initially deferred
for each row execute function private.queue_replaced_public_media();

drop trigger if exists queue_work_gallery_cleanup on public.work_media;
create constraint trigger queue_work_gallery_cleanup
after update or delete on public.work_media
deferrable initially deferred
for each row execute function private.queue_replaced_public_media();

drop function if exists public.read_media_cleanup(integer);
drop function if exists public.finish_media_cleanup(bigint[], text);

create function public.claim_media_cleanup(
  p_limit integer default 100,
  p_lease_seconds integer default 120
)
returns table(id bigint, object_path text, lease_token uuid, attempts integer)
language plpgsql
security definer
set search_path = ''
as $$
declare
  claimed_lease uuid := gen_random_uuid();
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'Forbidden';
  end if;
  if p_limit not between 1 and 100 or p_lease_seconds not between 15 and 300 then
    raise exception 'Invalid cleanup claim';
  end if;

  return query
  with candidates as (
    select q.id
    from private.media_cleanup_queue q
    where q.available_at <= now()
      and (q.lease_expires_at is null or q.lease_expires_at <= now())
      and not private.public_media_path_is_referenced(q.object_path)
    order by q.attempts, q.available_at, q.created_at
    for update skip locked
    limit p_limit
  ),
  claimed as (
    update private.media_cleanup_queue q
    set lease_token = claimed_lease,
        lease_expires_at = now() + make_interval(secs => p_lease_seconds),
        updated_at = now()
    from candidates c
    where q.id = c.id
    returning q.id, q.object_path, q.lease_token, q.attempts
  )
  select c.id, c.object_path, c.lease_token, c.attempts
  from claimed c;
end
$$;
revoke all on function public.claim_media_cleanup(integer, integer) from public, anon, authenticated;
grant execute on function public.claim_media_cleanup(integer, integer) to service_role;

create function public.finish_media_cleanup(
  p_ids bigint[],
  p_lease_token uuid,
  p_error text default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'Forbidden';
  end if;
  if p_ids is null or cardinality(p_ids) not between 1 and 100 or p_lease_token is null then
    raise exception 'Invalid cleanup completion';
  end if;

  if p_error is null then
    delete from private.media_cleanup_queue q
    where q.id = any(p_ids) and q.lease_token = p_lease_token;
  else
    update private.media_cleanup_queue q
    set attempts = q.attempts + 1,
        available_at = now() + make_interval(
          secs => least(3600, 15 * (1 << least(q.attempts, 8)))
        ),
        lease_token = null,
        lease_expires_at = null,
        last_error = left(p_error, 500),
        updated_at = now()
    where q.id = any(p_ids) and q.lease_token = p_lease_token;
  end if;

  get diagnostics changed = row_count;
  return changed;
end
$$;
revoke all on function public.finish_media_cleanup(bigint[], uuid, text) from public, anon, authenticated;
grant execute on function public.finish_media_cleanup(bigint[], uuid, text) to service_role;

create function public.enqueue_media_cleanup(
  p_paths text[],
  p_source_table text,
  p_source_id uuid
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  changed integer;
begin
  if coalesce(auth.jwt()->>'role', '') <> 'service_role' then
    raise exception 'Forbidden';
  end if;
  if p_paths is null or cardinality(p_paths) not between 1 and 100
     or p_source_table not in ('artisans', 'works')
     or p_source_id is null then
    raise exception 'Invalid cleanup enqueue';
  end if;
  if exists (
    select 1 from unnest(p_paths) as candidate(path)
    where char_length(candidate.path) not between 1 and 1024
       or candidate.path ~ '(^|/)\.\.?(/|$)'
       or candidate.path ~ '^/'
  ) then
    raise exception 'Invalid cleanup path';
  end if;

  insert into private.media_cleanup_queue(
    bucket_id, object_path, source_table, source_id, available_at
  )
  select 'public-media', candidate.path, p_source_table, p_source_id, now()
  from (select distinct path from unnest(p_paths) as supplied(path)) candidate
  where not private.public_media_path_is_referenced(candidate.path)
  on conflict(object_path) do update set
    source_table = excluded.source_table,
    source_id = excluded.source_id,
    available_at = least(private.media_cleanup_queue.available_at, now()),
    last_error = null,
    updated_at = now();

  get diagnostics changed = row_count;
  return changed;
end
$$;
revoke all on function public.enqueue_media_cleanup(text[], text, uuid) from public, anon, authenticated;
grant execute on function public.enqueue_media_cleanup(text[], text, uuid) to service_role;
