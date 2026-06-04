create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.reservations enable row level security;
alter table public.bus_availability enable row level security;

drop policy if exists profiles_select_own_or_admin on public.profiles;
create policy profiles_select_own_or_admin
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update
on public.profiles
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists trips_select_public on public.trips;
create policy trips_select_public
on public.trips
for select
to anon, authenticated
using (true);

drop policy if exists trips_admin_insert on public.trips;
create policy trips_admin_insert
on public.trips
for insert
to authenticated
with check (public.is_admin());

drop policy if exists trips_admin_update on public.trips;
create policy trips_admin_update
on public.trips
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists reservations_select_own_or_admin on public.reservations;
create policy reservations_select_own_or_admin
on public.reservations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

drop policy if exists reservations_update_own_or_admin on public.reservations;
create policy reservations_update_own_or_admin
on public.reservations
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists reservations_insert_own on public.reservations;
create policy reservations_insert_own
on public.reservations
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

drop policy if exists bus_availability_select_public on public.bus_availability;
create policy bus_availability_select_public
on public.bus_availability
for select
to anon, authenticated
using (true);

drop policy if exists bus_availability_admin_insert on public.bus_availability;
create policy bus_availability_admin_insert
on public.bus_availability
for insert
to authenticated
with check (public.is_admin());

drop policy if exists bus_availability_admin_update on public.bus_availability;
create policy bus_availability_admin_update
on public.bus_availability
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
