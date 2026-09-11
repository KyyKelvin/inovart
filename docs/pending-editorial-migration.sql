-- PENDING USER APPROVAL. Not applied to the remote database.
-- Target: test-artesao / fpjxixijldymlkajenck only.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
alter table public.artisan_submissions add column if not exists public_email boolean not null default false;
alter table public.artisan_submissions add column if not exists public_phone boolean not null default false;
alter table public.artisan_submissions add column if not exists public_instagram boolean not null default false;
alter table public.artisans add column if not exists source_submission_id uuid unique references public.artisan_submissions(id);
alter table public.works add column if not exists source_work_id uuid unique references public.submission_works(id);
create table if not exists public.public_contact_channels (
  artisan_id uuid not null references public.artisans(id) on delete cascade,
  kind text not null check (kind in ('email','phone','instagram')),
  value text not null,
  primary key (artisan_id,kind)
);
alter table public.public_contact_channels enable row level security;
create policy public_channels_select on public.public_contact_channels for select to anon, authenticated
using (exists(select 1 from public.artisans a where a.id=artisan_id and a.status='published'));
grant select on public.public_contact_channels to anon, authenticated;
alter table public.work_media add constraint work_media_work_position_key unique (work_id,position);

drop policy if exists submissions_public_insert on public.artisan_submissions;
drop policy if exists submission_works_public_insert on public.submission_works;
drop policy if exists contact_public_insert on public.contact_messages;
drop policy if exists submission_media_insert on storage.objects;
revoke insert on public.artisan_submissions,public.submission_works,public.contact_messages from anon;
grant select,insert,update,delete on public.artisan_submissions,public.submission_works,public.contact_messages,public.artisans,public.works,public.artisan_contacts,public.work_media,public.public_contact_channels to service_role;
grant usage, select on sequence public.moderation_events_id_seq to service_role;

create table private.request_limits (
  key text primary key, window_start timestamptz not null default now(), requests integer not null default 1
);
alter table private.request_limits enable row level security;
create index request_limits_window_start_idx on private.request_limits(window_start);
grant usage on schema private to service_role;
grant select,insert,update,delete on private.request_limits to service_role;
create function public.consume_request_limit(p_key text, p_limit integer default 5)
returns boolean language plpgsql security invoker set search_path='' as $$
declare allowed boolean;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'Forbidden'; end if;
  if char_length(p_key) > 180 or p_limit not between 1 and 100 then raise exception 'Invalid limit'; end if;
  insert into private.request_limits as r(key) values(p_key)
  on conflict(key) do update set
    requests=case when r.window_start < now()-interval '1 hour' then 1 else r.requests+1 end,
    window_start=case when r.window_start < now()-interval '1 hour' then now() else r.window_start end
  returning requests <= p_limit into allowed;
  return allowed;
end $$;
revoke all on function public.consume_request_limit(text,integer) from public, anon, authenticated;
grant execute on function public.consume_request_limit(text,integer) to service_role;

create function public.save_submission(p_id uuid, p_data jsonb, p_portrait text, p_works jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare w jsonb;
begin
 if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'Forbidden'; end if;
 if jsonb_typeof(p_works)<>'array' or jsonb_array_length(p_works) not between 1 and 3 then raise exception 'Invalid works'; end if;
 insert into public.artisan_submissions(id,name,craft,neighborhood,bio,email,phone,instagram,portrait_path,consent,public_email,public_phone,public_instagram)
 values(p_id,p_data->>'name',p_data->>'craft',p_data->>'neighborhood',p_data->>'bio',p_data->>'email',
 p_data->>'phone',p_data->>'instagram',p_portrait,(p_data->>'consent')::boolean,
 coalesce((p_data->>'public_email')::boolean,false),coalesce((p_data->>'public_phone')::boolean,false),coalesce((p_data->>'public_instagram')::boolean,false));
 for w in select * from jsonb_array_elements(p_works) loop
 insert into public.submission_works(submission_id,title,description,materials,image_paths,position)
 values(p_id,w->>'title',w->>'description',array(select jsonb_array_elements_text(w->'materials')),
 array(select jsonb_array_elements_text(w->'image_paths')),(w->>'position')::smallint);
 end loop;
 return p_id;
end $$;
revoke all on function public.save_submission(uuid,jsonb,text,jsonb) from public,anon,authenticated;
grant execute on function public.save_submission(uuid,jsonb,text,jsonb) to service_role;

create function public.review_submission(p_id uuid, p_status text, p_notes text default '')
returns uuid language plpgsql security invoker set search_path='' as $$
declare s public.artisan_submissions; a_id uuid; w public.submission_works;
begin
 if not public.is_admin() or auth.uid() is null then raise exception 'Forbidden'; end if;
 if p_status not in ('under_review','approved','rejected') then raise exception 'Invalid status'; end if;
 select * into s from public.artisan_submissions where id=p_id for update;
 if not found then raise exception 'Submission not found'; end if;
 if s.status='approved' and p_status<>'approved' then raise exception 'Approved submission is final'; end if;
 if p_status='approved' then
  insert into public.artisans(slug,name,craft,neighborhood,bio,status,source_submission_id)
  values('artesao-'||p_id::text,s.name,s.craft,s.neighborhood,s.bio,'draft',s.id)
  on conflict(source_submission_id) do update set source_submission_id=excluded.source_submission_id returning id into a_id;
  insert into public.artisan_contacts(artisan_id,email,phone,instagram,public_email,public_phone,public_instagram)
  values(a_id,s.email,s.phone,s.instagram,s.public_email,s.public_phone,s.public_instagram) on conflict(artisan_id) do nothing;
  for w in select * from public.submission_works where submission_id=p_id loop
   insert into public.works(artisan_id,slug,title,description,materials,status,source_work_id)
   values(a_id,'trabalho-'||w.id::text,w.title,w.description,w.materials,'draft',w.id) on conflict(source_work_id) do nothing;
  end loop;
 end if;
 update public.artisan_submissions set status=p_status,reviewer_notes=left(p_notes,3000),reviewed_by=auth.uid(),reviewed_at=now(),updated_at=now() where id=p_id;
 insert into public.moderation_events(submission_id,actor_id,action) values(p_id,auth.uid(),'submission_'||p_status);
 return a_id;
end $$;
revoke all on function public.review_submission(uuid,text,text) from public,anon;
grant execute on function public.review_submission(uuid,text,text) to authenticated;

create function private.sync_public_contacts() returns trigger language plpgsql security definer set search_path='' as $$
declare target_id uuid=case when tg_op='DELETE' then old.artisan_id else new.artisan_id end;
begin
 delete from public.public_contact_channels where artisan_id=target_id;
 if tg_op='DELETE' then return old; end if;
 if new.public_email and coalesce(new.email,'')<>'' then insert into public.public_contact_channels values(new.artisan_id,'email',new.email); end if;
 if new.public_phone and coalesce(new.phone,'')<>'' then insert into public.public_contact_channels values(new.artisan_id,'phone',new.phone); end if;
 if new.public_instagram and coalesce(new.instagram,'')<>'' then insert into public.public_contact_channels values(new.artisan_id,'instagram',new.instagram); end if;
 return new;
end $$;
revoke all on function private.sync_public_contacts() from public,anon,authenticated,service_role;
create trigger sync_public_contacts after insert or update or delete on public.artisan_contacts for each row execute function private.sync_public_contacts();

create function private.touch_updated_at() returns trigger language plpgsql set search_path='' as $$
begin new.updated_at=now(); return new; end $$;
revoke all on function private.touch_updated_at() from public,anon,authenticated,service_role;
create trigger artisans_updated before update on public.artisans for each row execute function private.touch_updated_at();
create trigger works_updated before update on public.works for each row execute function private.touch_updated_at();

drop policy if exists artisan_categories_public_read on public.artisan_categories;
drop policy if exists work_categories_public_read on public.work_categories;
drop policy if exists work_media_public_read on public.work_media;
create policy artisan_categories_public_read on public.artisan_categories for select to anon,authenticated using(exists(select 1 from public.artisans where id=artisan_id and status='published') or (select public.is_admin()));
create policy work_categories_public_read on public.work_categories for select to anon,authenticated using(exists(select 1 from public.works w join public.artisans a on a.id=w.artisan_id where w.id=work_id and w.status='published' and a.status='published') or (select public.is_admin()));
create policy work_media_public_read on public.work_media for select to anon,authenticated using(exists(select 1 from public.works w join public.artisans a on a.id=w.artisan_id where w.id=work_id and w.status='published' and a.status='published') or (select public.is_admin()));
drop policy if exists works_public_read on public.works;
create policy works_public_read on public.works for select to anon,authenticated using((status='published' and exists(select 1 from public.artisans where id=artisan_id and status='published')) or (select public.is_admin()));

create table private.integration_settings (key text primary key, value text not null);
alter table private.integration_settings enable row level security;
revoke all on private.integration_settings from public,anon,authenticated,service_role;
create function public.read_integration_setting(p_key text) returns text language plpgsql security definer set search_path='' as $$
declare setting_value text;
begin
 if coalesce(auth.jwt()->>'role','') <> 'service_role' then raise exception 'Forbidden'; end if;
 select value into setting_value from private.integration_settings where key=p_key;
 return setting_value;
end $$;
revoke all on function public.read_integration_setting(text) from public,anon,authenticated;
grant execute on function public.read_integration_setting(text) to service_role;
alter table public.artisan_contacts alter column public_instagram set default false;

create function public.save_editorial_record(p_table text,p_id uuid,p_values jsonb)
returns uuid language plpgsql security invoker set search_path='' as $$
declare saved_id uuid; c uuid;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden'; end if;
 saved_id=coalesce(p_id,gen_random_uuid());
 if p_table='artisans' then
  insert into public.artisans(id,name,slug,craft,bio,neighborhood,quote,featured)
  values(saved_id,p_values->>'name',p_values->>'slug',p_values->>'craft',p_values->>'bio',p_values->>'neighborhood',p_values->>'quote',coalesce((p_values->>'featured')::boolean,false))
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,craft=excluded.craft,bio=excluded.bio,neighborhood=excluded.neighborhood,quote=excluded.quote,featured=excluded.featured;
  delete from public.artisan_categories where artisan_id=saved_id;
  for c in select value::uuid from jsonb_array_elements_text(p_values->'category_ids') loop
   insert into public.artisan_categories values(saved_id,c) on conflict do nothing;
  end loop;
 elsif p_table='works' then
  insert into public.works(id,title,slug,description,artisan_id,materials,year,featured)
  values(saved_id,p_values->>'title',p_values->>'slug',p_values->>'description',(p_values->>'artisan_id')::uuid,array(select jsonb_array_elements_text(p_values->'materials')),(p_values->>'year')::smallint,coalesce((p_values->>'featured')::boolean,false))
  on conflict(id) do update set title=excluded.title,slug=excluded.slug,description=excluded.description,artisan_id=excluded.artisan_id,materials=excluded.materials,year=excluded.year,featured=excluded.featured;
  delete from public.work_categories where work_id=saved_id;
  for c in select value::uuid from jsonb_array_elements_text(p_values->'category_ids') loop
   insert into public.work_categories values(saved_id,c) on conflict do nothing;
  end loop;
 elsif p_table='categories' then
  insert into public.categories(id,name,slug,description) values(saved_id,p_values->>'name',p_values->>'slug',p_values->>'description')
  on conflict(id) do update set name=excluded.name,slug=excluded.slug,description=excluded.description;
 else raise exception 'Invalid table';
 end if;
 insert into public.moderation_events(actor_id,action,details) values(auth.uid(),'record_saved',jsonb_build_object('table',p_table,'id',saved_id));
 return saved_id;
end $$;
revoke all on function public.save_editorial_record(text,uuid,jsonb) from public,anon;
grant execute on function public.save_editorial_record(text,uuid,jsonb) to authenticated;

create function public.publish_editorial_record(p_table text,p_id uuid,p_media jsonb default '{}'::jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare old_urls jsonb='[]'::jsonb; item jsonb; parent_status text;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden'; end if;
 if p_table='artisans' then
  select case when p_media ? 'portrait_url' and portrait_url is not null then jsonb_build_array(portrait_url) else '[]'::jsonb end into old_urls from public.artisans where id=p_id for update;
  if not found then raise exception 'Record not found'; end if;
  update public.artisans set portrait_url=coalesce(p_media->>'portrait_url',portrait_url),status='published',published_at=now() where id=p_id;
 elsif p_table='works' then
  select a.status into parent_status from public.works w join public.artisans a on a.id=w.artisan_id where w.id=p_id for update of w;
  if not found then raise exception 'Record not found'; end if;
  if parent_status<>'published' then raise exception 'Parent must be published'; end if;
  if p_media ? 'items' then
   select coalesce(jsonb_agg(url),'[]'::jsonb) into old_urls from (
    select cover_url as url from public.works where id=p_id and cover_url is not null
    union select url from public.work_media where work_id=p_id
   ) existing;
   delete from public.work_media where work_id=p_id;
   for item in select * from jsonb_array_elements(coalesce(p_media->'items','[]'::jsonb)) loop
    insert into public.work_media(work_id,url,alt_text,position)
    values(p_id,item->>'url',item->>'alt_text',(item->>'position')::smallint);
   end loop;
  end if;
  update public.works set cover_url=case when p_media ? 'cover_url' then p_media->>'cover_url' else cover_url end,status='published',published_at=now() where id=p_id;
 else raise exception 'Invalid table';
 end if;
 insert into public.moderation_events(actor_id,action,details) values(auth.uid(),'record_published',jsonb_build_object('table',p_table,'id',p_id));
 return jsonb_build_object('id',p_id,'old_urls',old_urls);
end $$;
revoke all on function public.publish_editorial_record(text,uuid,jsonb) from public,anon;
grant execute on function public.publish_editorial_record(text,uuid,jsonb) to authenticated;

create function public.archive_editorial_record(p_table text,p_id uuid)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare old_urls jsonb='[]'::jsonb;
begin
 if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden'; end if;
 if p_table='artisans' then
  perform 1 from public.artisans where id=p_id for update;
  if not found then raise exception 'Record not found'; end if;
  select coalesce(jsonb_agg(url),'[]'::jsonb) into old_urls from (
   select portrait_url as url from public.artisans where id=p_id and portrait_url is not null
   union select url from public.artisan_media where artisan_id=p_id
   union select cover_url from public.works where artisan_id=p_id and cover_url is not null
   union select wm.url from public.work_media wm join public.works w on w.id=wm.work_id where w.artisan_id=p_id
  ) existing;
  delete from public.work_media where work_id in (select id from public.works where artisan_id=p_id);
  delete from public.artisan_media where artisan_id=p_id;
  update public.works set status='archived',cover_url=null where artisan_id=p_id;
  update public.artisans set status='archived',portrait_url=null where id=p_id;
 elsif p_table='works' then
  perform 1 from public.works where id=p_id for update;
  if not found then raise exception 'Record not found'; end if;
  select coalesce(jsonb_agg(url),'[]'::jsonb) into old_urls from (
   select cover_url as url from public.works where id=p_id and cover_url is not null
   union select url from public.work_media where work_id=p_id
  ) existing;
  delete from public.work_media where work_id=p_id;
  update public.works set status='archived',cover_url=null where id=p_id;
 else raise exception 'Invalid table';
 end if;
 insert into public.moderation_events(actor_id,action,details) values(auth.uid(),'record_archived',jsonb_build_object('table',p_table,'id',p_id));
 return jsonb_build_object('id',p_id,'old_urls',old_urls);
end $$;
revoke all on function public.archive_editorial_record(text,uuid) from public,anon;
grant execute on function public.archive_editorial_record(text,uuid) to authenticated;
