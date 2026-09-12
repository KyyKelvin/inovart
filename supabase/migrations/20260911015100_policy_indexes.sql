create index artisan_categories_category_idx on public.artisan_categories(category_id);
create index submissions_reviewer_idx on public.artisan_submissions(reviewed_by) where reviewed_by is not null;
create index moderation_actor_idx on public.moderation_events(actor_id) where actor_id is not null;
create index work_categories_category_idx on public.work_categories(category_id);

drop policy categories_public_read on public.categories;
drop policy artisans_public_read on public.artisans;
drop policy works_public_read on public.works;
drop policy artisan_categories_public_read on public.artisan_categories;
drop policy work_categories_public_read on public.work_categories;
drop policy artisan_media_public_read on public.artisan_media;
drop policy work_media_public_read on public.work_media;
drop policy submissions_public_insert on public.artisan_submissions;
drop policy submission_works_public_insert on public.submission_works;
drop policy contact_public_insert on public.contact_messages;
drop policy public_media_read on storage.objects;
drop policy submission_media_insert on storage.objects;

create policy categories_public_read on public.categories for select to anon using (true);
create policy artisans_public_read on public.artisans for select to anon using (status = 'published');
create policy works_public_read on public.works for select to anon using (status = 'published');
create policy artisan_categories_public_read on public.artisan_categories for select to anon using (true);
create policy work_categories_public_read on public.work_categories for select to anon using (true);
create policy artisan_media_public_read on public.artisan_media for select to anon using (exists (select 1 from public.artisans a where a.id = artisan_id and a.status = 'published'));
create policy work_media_public_read on public.work_media for select to anon using (exists (select 1 from public.works w where w.id = work_id and w.status = 'published'));
create policy submissions_public_insert on public.artisan_submissions for insert to anon with check (status = 'pending' and reviewed_by is null and reviewed_at is null);
create policy submission_works_public_insert on public.submission_works for insert to anon with check (exists (select 1 from public.artisan_submissions s where s.id = submission_id and s.status = 'pending' and s.created_at > now() - interval '30 minutes'));
create policy contact_public_insert on public.contact_messages for insert to anon with check (status = 'new');
create policy public_media_read on storage.objects for select to anon using (bucket_id = 'public-media');
create policy submission_media_insert on storage.objects for insert to anon with check (
  bucket_id = 'submission-media'
  and exists (select 1 from public.artisan_submissions s where s.id::text = (storage.foldername(name))[1] and s.status = 'pending' and s.created_at > now() - interval '30 minutes')
);
