alter table public.artisans
  add column if not exists craft_category_id uuid references public.categories(id) on delete set null,
  add column if not exists region_withheld boolean not null default false;

alter table public.artisan_submissions
  add column if not exists craft_category_id uuid references public.categories(id) on delete set null,
  add column if not exists region_withheld boolean not null default false;

alter table public.works
  add column if not exists price_cents integer check (price_cents between 0 and 999999999),
  add column if not exists shipping_details text check (char_length(shipping_details) <= 500);

alter table public.submission_works
  add column if not exists price_cents integer check (price_cents between 0 and 999999999),
  add column if not exists shipping_details text check (char_length(shipping_details) <= 500);

create index if not exists artisans_craft_category_idx
  on public.artisans(craft_category_id);
create index if not exists submissions_craft_category_idx
  on public.artisan_submissions(craft_category_id);

update public.artisans as artisan
set craft_category_id = category.id
from public.categories as category
where artisan.craft_category_id is null
  and lower(category.name) = lower(artisan.craft);

update public.artisan_submissions as submission
set craft_category_id = category.id
from public.categories as category
where submission.craft_category_id is null
  and lower(category.name) = lower(submission.craft);

create or replace function public.save_submission(
  p_id uuid,
  p_data jsonb,
  p_portrait text,
  p_works jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  w jsonb;
  craft_id uuid;
  craft_name text;
  withhold_region boolean;
begin
  if coalesce(auth.jwt()->>'role','') <> 'service_role' then
    raise exception 'Forbidden';
  end if;
  if jsonb_typeof(p_works) <> 'array' or jsonb_array_length(p_works) not between 1 and 3 then
    raise exception 'Invalid works';
  end if;

  craft_id := (p_data->>'craft_category_id')::uuid;
  select name into craft_name from public.categories where id = craft_id;
  if craft_name is null then raise exception 'Invalid craft category'; end if;
  withhold_region := coalesce((p_data->>'region_withheld')::boolean, false);

  insert into public.artisan_submissions(
    id, name, craft, craft_category_id, neighborhood, region_withheld, bio,
    email, phone, instagram, portrait_path, consent,
    public_email, public_phone, public_instagram
  ) values (
    p_id,
    p_data->>'name',
    craft_name,
    craft_id,
    case when withhold_region then null else nullif(trim(p_data->>'neighborhood'), '') end,
    withhold_region,
    p_data->>'bio',
    p_data->>'email',
    p_data->>'phone',
    p_data->>'instagram',
    p_portrait,
    (p_data->>'consent')::boolean,
    coalesce((p_data->>'public_email')::boolean, false),
    coalesce((p_data->>'public_phone')::boolean, false),
    coalesce((p_data->>'public_instagram')::boolean, false)
  );

  for w in select * from jsonb_array_elements(p_works) loop
    insert into public.submission_works(
      submission_id, title, description, materials, image_paths, position,
      price_cents, shipping_details
    ) values (
      p_id,
      w->>'title',
      w->>'description',
      array(select jsonb_array_elements_text(w->'materials')),
      array(select jsonb_array_elements_text(w->'image_paths')),
      (w->>'position')::smallint,
      (w->>'price_cents')::integer,
      nullif(trim(w->>'shipping_details'), '')
    );
  end loop;
  return p_id;
end
$$;

create or replace function public.review_submission(
  p_id uuid,
  p_status text,
  p_notes text default ''
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s public.artisan_submissions;
  a_id uuid;
  w public.submission_works;
begin
  if not public.is_admin() or auth.uid() is null then raise exception 'Forbidden'; end if;
  if p_status not in ('under_review','approved','rejected') then raise exception 'Invalid status'; end if;

  select * into s from public.artisan_submissions where id = p_id for update;
  if not found then raise exception 'Submission not found'; end if;
  if s.status = 'approved' and p_status <> 'approved' then raise exception 'Approved submission is final'; end if;

  if p_status = 'approved' then
    insert into public.artisans(
      slug, name, craft, craft_category_id, neighborhood, region_withheld,
      bio, status, source_submission_id
    ) values (
      'artesao-' || p_id::text,
      s.name,
      s.craft,
      s.craft_category_id,
      s.neighborhood,
      s.region_withheld,
      s.bio,
      'draft',
      s.id
    )
    on conflict(source_submission_id) do update
      set source_submission_id = excluded.source_submission_id
    returning id into a_id;

    if s.craft_category_id is not null then
      insert into public.artisan_categories(artisan_id, category_id)
      values(a_id, s.craft_category_id)
      on conflict do nothing;
    end if;

    insert into public.artisan_contacts(
      artisan_id, email, phone, instagram,
      public_email, public_phone, public_instagram
    ) values (
      a_id, s.email, s.phone, s.instagram,
      s.public_email, s.public_phone, s.public_instagram
    ) on conflict(artisan_id) do nothing;

    for w in select * from public.submission_works where submission_id = p_id loop
      insert into public.works(
        artisan_id, slug, title, description, materials, price_cents,
        shipping_details, status, source_work_id
      ) values (
        a_id,
        'trabalho-' || w.id::text,
        w.title,
        w.description,
        w.materials,
        w.price_cents,
        w.shipping_details,
        'draft',
        w.id
      ) on conflict(source_work_id) do nothing;
    end loop;
  end if;

  update public.artisan_submissions
  set status = p_status,
      reviewer_notes = left(p_notes, 3000),
      reviewed_by = auth.uid(),
      reviewed_at = now(),
      updated_at = now()
  where id = p_id;

  insert into public.moderation_events(submission_id, actor_id, action)
  values(p_id, auth.uid(), 'submission_' || p_status);
  return a_id;
end
$$;

create or replace function public.save_editorial_record(
  p_table text,
  p_id uuid,
  p_values jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  saved_id uuid;
  c uuid;
  craft_id uuid;
  craft_name text;
  withhold_region boolean;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden'; end if;
  saved_id := coalesce(p_id, gen_random_uuid());

  if p_table = 'artisans' then
    craft_id := (p_values->>'craft_category_id')::uuid;
    select name into craft_name from public.categories where id = craft_id;
    if craft_name is null then raise exception 'Invalid craft category'; end if;
    withhold_region := coalesce((p_values->>'region_withheld')::boolean, false);

    insert into public.artisans(
      id, name, slug, craft, craft_category_id, bio, neighborhood,
      region_withheld, quote, featured
    ) values (
      saved_id,
      p_values->>'name',
      p_values->>'slug',
      craft_name,
      craft_id,
      p_values->>'bio',
      case when withhold_region then null else nullif(trim(p_values->>'neighborhood'), '') end,
      withhold_region,
      p_values->>'quote',
      coalesce((p_values->>'featured')::boolean, false)
    )
    on conflict(id) do update set
      name = excluded.name,
      slug = excluded.slug,
      craft = excluded.craft,
      craft_category_id = excluded.craft_category_id,
      bio = excluded.bio,
      neighborhood = excluded.neighborhood,
      region_withheld = excluded.region_withheld,
      quote = excluded.quote,
      featured = excluded.featured;

    delete from public.artisan_categories where artisan_id = saved_id;
    for c in select value::uuid from jsonb_array_elements_text(p_values->'category_ids') loop
      insert into public.artisan_categories(artisan_id, category_id)
      values(saved_id, c) on conflict do nothing;
    end loop;
    insert into public.artisan_categories(artisan_id, category_id)
    values(saved_id, craft_id) on conflict do nothing;

  elsif p_table = 'works' then
    insert into public.works(
      id, title, slug, description, artisan_id, materials, year,
      price_cents, shipping_details, featured
    ) values (
      saved_id,
      p_values->>'title',
      p_values->>'slug',
      p_values->>'description',
      (p_values->>'artisan_id')::uuid,
      array(select jsonb_array_elements_text(p_values->'materials')),
      (p_values->>'year')::smallint,
      (p_values->>'price_cents')::integer,
      nullif(trim(p_values->>'shipping_details'), ''),
      coalesce((p_values->>'featured')::boolean, false)
    )
    on conflict(id) do update set
      title = excluded.title,
      slug = excluded.slug,
      description = excluded.description,
      artisan_id = excluded.artisan_id,
      materials = excluded.materials,
      year = excluded.year,
      price_cents = excluded.price_cents,
      shipping_details = excluded.shipping_details,
      featured = excluded.featured;

    delete from public.work_categories where work_id = saved_id;
    for c in select value::uuid from jsonb_array_elements_text(p_values->'category_ids') loop
      insert into public.work_categories(work_id, category_id)
      values(saved_id, c) on conflict do nothing;
    end loop;

  elsif p_table = 'categories' then
    insert into public.categories(id, name, slug, description)
    values(saved_id, p_values->>'name', p_values->>'slug', p_values->>'description')
    on conflict(id) do update set
      name = excluded.name,
      slug = excluded.slug,
      description = excluded.description;
  else
    raise exception 'Invalid table';
  end if;

  insert into public.moderation_events(actor_id, action, details)
  values(auth.uid(), 'record_saved', jsonb_build_object('table', p_table, 'id', saved_id));
  return saved_id;
end
$$;

create or replace function public.delete_editorial_category(p_id uuid)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  deleted_name text;
begin
  if auth.uid() is null or not public.is_admin() then raise exception 'Forbidden'; end if;

  delete from public.categories
  where id = p_id
  returning name into deleted_name;
  if deleted_name is null then raise exception 'Category not found'; end if;

  insert into public.moderation_events(actor_id, action, details)
  values(
    auth.uid(),
    'category_deleted',
    jsonb_build_object('id', p_id, 'name', deleted_name)
  );
  return p_id;
end
$$;

revoke all on function public.delete_editorial_category(uuid) from public, anon;
grant execute on function public.delete_editorial_category(uuid) to authenticated;
