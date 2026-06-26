create or replace function public.reservation_blocks_seat(p_status text)
returns boolean
language sql
immutable
as $$
  select p_status in ('accepted', 'payment_pending', 'paid', 'confirmed');
$$;

alter table public.reservations
  add column if not exists cancelled_at timestamptz,
  add column if not exists cancelled_by text,
  add column if not exists cancelled_less_than_24h_before_trip boolean,
  add column if not exists terms_accepted_at timestamptz,
  add column if not exists terms_version text,
  add column if not exists expires_at timestamptz;

alter table public.reservations
  drop constraint if exists reservations_status_check;

update public.reservations
set status = 'cancelled_user',
    cancelled_by = coalesce(cancelled_by, 'user'),
    cancelled_at = coalesce(cancelled_at, updated_at, now())
where status = 'cancelled';

update public.reservations
set terms_accepted_at = coalesce(terms_accepted_at, created_at, now()),
    terms_version = coalesce(terms_version, 'legacy')
where user_id is not null
  and status in ('requested', 'accepted', 'payment_pending', 'paid', 'confirmed');

alter table public.reservations
  alter column status set default 'requested';

alter table public.reservations
  add constraint reservations_status_check check (
    status in (
      'requested',
      'accepted',
      'payment_pending',
      'paid',
      'confirmed',
      'rejected',
      'cancelled_user',
      'cancelled_admin',
      'expired',
      'no_show'
    )
  );

alter table public.reservations
  drop constraint if exists reservations_cancelled_by_check;

alter table public.reservations
  add constraint reservations_cancelled_by_check check (
    cancelled_by is null or cancelled_by in ('user', 'admin', 'system')
  );

alter table public.reservations
  drop constraint if exists reservations_terms_for_active_user_reservations_check;

alter table public.reservations
  add constraint reservations_terms_for_active_user_reservations_check check (
    user_id is null
    or status not in ('requested', 'accepted', 'payment_pending', 'paid', 'confirmed')
    or terms_accepted_at is not null
  );

create unique index if not exists reservations_one_active_user_trip_idx
on public.reservations (user_id, trip_id)
where user_id is not null
  and status in ('requested', 'accepted', 'payment_pending', 'paid', 'confirmed');

create index if not exists reservations_requested_active_idx
on public.reservations (user_id, expires_at)
where status = 'requested';

create table if not exists public.reservation_audit_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  action_type text not null,
  reservation_id text not null references public.reservations(id) on delete cascade,
  previous_status text,
  new_status text,
  created_at timestamptz not null default now()
);

alter table public.reservation_audit_log enable row level security;

drop policy if exists reservation_audit_log_admin_select on public.reservation_audit_log;
create policy reservation_audit_log_admin_select
on public.reservation_audit_log
for select
to authenticated
using (public.is_admin());

create or replace view public.trips_with_seats as
select
  t.id,
  t.route,
  t.date,
  t.cancelled,
  coalesce(t.max_seats, 7) as max_seats,
  coalesce(sum(r.seats) filter (where public.reservation_blocks_seat(r.status)), 0)::integer as used_seats,
  greatest(
    coalesce(t.max_seats, 7) - coalesce(sum(r.seats) filter (where public.reservation_blocks_seat(r.status)), 0),
    0
  )::integer as free_seats
from public.trips t
left join public.reservations r on r.trip_id = t.id
group by t.id, t.route, t.date, t.cancelled, t.max_seats;

grant select on public.trips_with_seats to anon, authenticated;

drop policy if exists reservations_insert_own on public.reservations;
drop policy if exists reservations_update_own_or_admin on public.reservations;
drop policy if exists reservations_admin_update on public.reservations;

drop function if exists public.create_reservation_atomic(text, text, text, text, integer, text, uuid);
drop function if exists public.create_reservation_request(text, text, text, text, integer, text, boolean, text);

create or replace function public.create_reservation_request(
  p_trip_id text,
  p_passenger_name text,
  p_passenger_email text,
  p_passenger_phone text,
  p_seats integer default 1,
  p_notes text default null,
  p_terms_accepted boolean default false,
  p_terms_version text default '2026-06-26'
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_email_confirmed_at timestamptz;
  v_used_seats integer;
  v_requested_count integer;
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowany, aby wysłać zgłoszenie rezerwacji.' using errcode = '42501';
  end if;

  select u.email_confirmed_at
  into v_email_confirmed_at
  from auth.users u
  where u.id = auth.uid();

  if v_email_confirmed_at is null then
    raise exception 'Potwierdź adres email przed wysłaniem zgłoszenia rezerwacji.' using errcode = '42501';
  end if;

  if coalesce(trim(p_trip_id), '') = '' then
    raise exception 'Brak identyfikatora kursu.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_passenger_name), '') = '' then
    raise exception 'Imię i nazwisko jest wymagane.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_passenger_email), '') = '' then
    raise exception 'Email jest wymagany.' using errcode = 'P0001';
  end if;

  if p_seats is null or p_seats <> 1 then
    raise exception 'Przez formularz online możesz zgłosić rezerwację tylko jednego miejsca.' using errcode = 'P0001';
  end if;

  if not coalesce(p_terms_accepted, false) then
    raise exception 'Akceptacja regulaminu i zasad anulowania jest wymagana.' using errcode = 'P0001';
  end if;

  update public.reservations
  set status = 'expired'
  where user_id = auth.uid()
    and status = 'requested'
    and coalesce(expires_at, created_at + interval '48 hours') <= now();

  select *
  into v_trip
  from public.trips
  where id = p_trip_id
  for update;

  if not found then
    raise exception 'Kurs nie istnieje.' using errcode = 'P0001';
  end if;

  if v_trip.cancelled then
    raise exception 'Ten kurs jest odwołany.' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.reservations
    where trip_id = p_trip_id
      and user_id = auth.uid()
      and status in ('requested', 'accepted', 'payment_pending', 'paid', 'confirmed')
  ) then
    raise exception 'Masz już aktywne zgłoszenie lub rezerwację na ten kurs.' using errcode = 'P0001';
  end if;

  select count(*)
  into v_requested_count
  from public.reservations
  where user_id = auth.uid()
    and status = 'requested'
    and coalesce(expires_at, created_at + interval '48 hours') > now();

  if v_requested_count >= 4 then
    raise exception 'Masz już maksymalną liczbę aktywnych zgłoszeń rezerwacji. Poczekaj na obsługę albo anuluj jedno zgłoszenie.' using errcode = 'P0001';
  end if;

  select coalesce(sum(seats), 0)::integer
  into v_used_seats
  from public.reservations
  where trip_id = p_trip_id
    and public.reservation_blocks_seat(status);

  if v_used_seats + 1 > v_trip.max_seats then
    raise exception 'Brak wystarczającej liczby miejsc. Dostępnych miejsc: %.', greatest(v_trip.max_seats - v_used_seats, 0) using errcode = 'P0001';
  end if;

  insert into public.reservations (
    id,
    trip_id,
    user_id,
    passenger_name,
    passenger_email,
    passenger_phone,
    seats,
    notes,
    status,
    expires_at,
    terms_accepted_at,
    terms_version
  )
  values (
    'R' || replace(gen_random_uuid()::text, '-', ''),
    p_trip_id,
    auth.uid(),
    trim(p_passenger_name),
    lower(trim(p_passenger_email)),
    nullif(trim(coalesce(p_passenger_phone, '')), ''),
    1,
    nullif(trim(coalesce(p_notes, '')), ''),
    'requested',
    now() + interval '48 hours',
    now(),
    nullif(trim(coalesce(p_terms_version, '')), '')
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) to authenticated;

drop function if exists public.cancel_own_reservation(text);

create or replace function public.cancel_own_reservation(p_reservation_id text)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Musisz być zalogowany, aby anulować rezerwację.' using errcode = '42501';
  end if;

  select r.*
  into v_reservation
  from public.reservations r
  where r.id = p_reservation_id
    and r.user_id = auth.uid()
  for update;

  if not found then
    raise exception 'Rezerwacja nie istnieje albo nie należy do zalogowanego użytkownika.' using errcode = '42501';
  end if;

  if v_reservation.status in ('cancelled_user', 'cancelled_admin', 'rejected', 'expired', 'no_show') then
    return v_reservation;
  end if;

  update public.reservations r
  set status = 'cancelled_user',
      cancelled_at = now(),
      cancelled_by = 'user',
      cancelled_less_than_24h_before_trip = (
        select t.date::timestamptz - now() < interval '24 hours'
        from public.trips t
        where t.id = r.trip_id
      )
  where r.id = p_reservation_id
    and r.user_id = auth.uid()
  returning * into v_reservation;

  return v_reservation;
end;
$$;

revoke execute on function public.cancel_own_reservation(text) from public, anon, authenticated;
grant execute on function public.cancel_own_reservation(text) to authenticated;

drop function if exists public.admin_set_reservation_status(text, text);

create or replace function public.admin_set_reservation_status(
  p_reservation_id text,
  p_status text
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_trip public.trips%rowtype;
  v_used_seats integer;
  v_previous_status text;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Brak uprawnień administratora.' using errcode = '42501';
  end if;

  if p_status not in ('accepted', 'payment_pending', 'confirmed', 'rejected', 'cancelled_admin', 'expired') then
    raise exception 'Nieobsługiwany status rezerwacji: %.', p_status using errcode = 'P0001';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Rezerwacja nie istnieje.' using errcode = 'P0001';
  end if;

  v_previous_status := v_reservation.status;

  select *
  into v_trip
  from public.trips
  where id = v_reservation.trip_id
  for update;

  if not found then
    raise exception 'Kurs przypisany do rezerwacji nie istnieje.' using errcode = 'P0001';
  end if;

  if public.reservation_blocks_seat(p_status) then
    select coalesce(sum(seats), 0)::integer
    into v_used_seats
    from public.reservations
    where trip_id = v_reservation.trip_id
      and id <> v_reservation.id
      and public.reservation_blocks_seat(status);

    if v_used_seats + v_reservation.seats > v_trip.max_seats then
      raise exception 'Brak wystarczającej liczby miejsc. Dostępnych miejsc: %.', greatest(v_trip.max_seats - v_used_seats, 0) using errcode = 'P0001';
    end if;
  end if;

  update public.reservations
  set status = p_status,
      cancelled_at = case when p_status = 'cancelled_admin' then now() else cancelled_at end,
      cancelled_by = case when p_status = 'cancelled_admin' then 'admin' else cancelled_by end,
      cancelled_less_than_24h_before_trip = case
        when p_status = 'cancelled_admin' then v_trip.date::timestamptz - now() < interval '24 hours'
        else cancelled_less_than_24h_before_trip
      end
  where id = p_reservation_id
  returning * into v_reservation;

  insert into public.reservation_audit_log (
    actor_id,
    action_type,
    reservation_id,
    previous_status,
    new_status
  )
  values (
    auth.uid(),
    'admin_set_reservation_status',
    p_reservation_id,
    v_previous_status,
    p_status
  );

  return v_reservation;
end;
$$;

revoke execute on function public.admin_set_reservation_status(text, text) from public, anon, authenticated;
grant execute on function public.admin_set_reservation_status(text, text) to authenticated;
