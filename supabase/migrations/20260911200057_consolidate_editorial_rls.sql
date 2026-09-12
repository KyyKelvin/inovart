drop policy if exists admin_artisan_categories_all on public.artisan_categories;
create policy admin_artisan_categories_insert on public.artisan_categories
for insert to authenticated with check ((select public.is_admin()));
create policy admin_artisan_categories_update on public.artisan_categories
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_artisan_categories_delete on public.artisan_categories
for delete to authenticated using ((select public.is_admin()));

drop policy if exists admin_work_categories_all on public.work_categories;
create policy admin_work_categories_insert on public.work_categories
for insert to authenticated with check ((select public.is_admin()));
create policy admin_work_categories_update on public.work_categories
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_work_categories_delete on public.work_categories
for delete to authenticated using ((select public.is_admin()));

drop policy if exists admin_work_media_all on public.work_media;
create policy admin_work_media_insert on public.work_media
for insert to authenticated with check ((select public.is_admin()));
create policy admin_work_media_update on public.work_media
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_work_media_delete on public.work_media
for delete to authenticated using ((select public.is_admin()));

drop policy if exists admin_works_all on public.works;
create policy admin_works_insert on public.works
for insert to authenticated with check ((select public.is_admin()));
create policy admin_works_update on public.works
for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy admin_works_delete on public.works
for delete to authenticated using ((select public.is_admin()));
