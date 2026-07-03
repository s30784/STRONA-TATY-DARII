create table if not exists public.notification_events (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  related_entity_type text not null,
  related_entity_id text not null,
  status text not null default 'pending',
  error_message text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint notification_events_status_check check (status in ('pending', 'sent', 'failed'))
);

create index if not exists notification_events_status_created_at_idx
on public.notification_events(status, created_at);

alter table public.notification_events enable row level security;

drop policy if exists notification_events_admin_select on public.notification_events;
create policy notification_events_admin_select
on public.notification_events
for select
to authenticated
using (public.is_admin());

create table if not exists public.rental_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  bus_id text not null,
  start_date date not null,
  end_date date not null,
  phone text not null,
  email text not null,
  message text,
  status text not null default 'new',
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rental_requests_bus_id_check check (bus_id in ('bus9', 'bus8')),
  constraint rental_requests_status_check check (status in ('new', 'contacted', 'priced', 'accepted', 'rejected', 'closed')),
  constraint rental_requests_date_check check (end_date >= start_date)
);

create index if not exists rental_requests_status_created_at_idx
on public.rental_requests(status, created_at desc);

drop trigger if exists rental_requests_set_updated_at on public.rental_requests;
create trigger rental_requests_set_updated_at
before update on public.rental_requests
for each row execute function public.set_updated_at();

alter table public.rental_requests enable row level security;

drop policy if exists rental_requests_admin_select on public.rental_requests;
create policy rental_requests_admin_select
on public.rental_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists rental_requests_admin_update on public.rental_requests;
create policy rental_requests_admin_update
on public.rental_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create table if not exists public.tow_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  pickup_location text not null,
  dropoff_location text not null,
  vehicle_info text not null,
  phone text not null,
  email text not null,
  message text,
  status text not null default 'new',
  estimated_price numeric(10,2),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tow_requests_status_check check (status in ('new', 'contacted', 'priced', 'accepted', 'rejected', 'closed')),
  constraint tow_requests_estimated_price_check check (estimated_price is null or estimated_price >= 0)
);

create index if not exists tow_requests_status_created_at_idx
on public.tow_requests(status, created_at desc);

drop trigger if exists tow_requests_set_updated_at on public.tow_requests;
create trigger tow_requests_set_updated_at
before update on public.tow_requests
for each row execute function public.set_updated_at();

alter table public.tow_requests enable row level security;

drop policy if exists tow_requests_admin_select on public.tow_requests;
create policy tow_requests_admin_select
on public.tow_requests
for select
to authenticated
using (public.is_admin());

drop policy if exists tow_requests_admin_update on public.tow_requests;
create policy tow_requests_admin_update
on public.tow_requests
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop function if exists public.create_rental_request(text, date, date, text, text, text);

create or replace function public.create_rental_request(
  p_bus_id text,
  p_start_date date,
  p_end_date date,
  p_phone text,
  p_email text,
  p_message text default null
)
returns public.rental_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.rental_requests%rowtype;
begin
  if p_bus_id not in ('bus9', 'bus8') then
    raise exception 'Nieobsługiwany bus.' using errcode = 'P0001';
  end if;

  if p_start_date is null or p_end_date is null or p_end_date < p_start_date then
    raise exception 'Wybierz poprawny termin wynajmu.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Telefon jest wymagany.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_email), '') = '' then
    raise exception 'Email jest wymagany.' using errcode = 'P0001';
  end if;

  insert into public.rental_requests (
    user_id,
    bus_id,
    start_date,
    end_date,
    phone,
    email,
    message,
    status
  )
  values (
    auth.uid(),
    p_bus_id,
    p_start_date,
    p_end_date,
    trim(p_phone),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_message, '')), ''),
    'new'
  )
  returning * into v_request;

  insert into public.notification_events (type, related_entity_type, related_entity_id)
  values ('new_rental_request', 'rental_request', v_request.id::text);

  return v_request;
end;
$$;

revoke execute on function public.create_rental_request(text, date, date, text, text, text) from public, anon, authenticated;
grant execute on function public.create_rental_request(text, date, date, text, text, text) to anon, authenticated;

drop function if exists public.create_tow_request(text, text, text, text, text, text);

create or replace function public.create_tow_request(
  p_pickup_location text,
  p_dropoff_location text,
  p_vehicle_info text,
  p_phone text,
  p_email text,
  p_message text default null
)
returns public.tow_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.tow_requests%rowtype;
begin
  if coalesce(trim(p_pickup_location), '') = '' then
    raise exception 'Miejsce odbioru jest wymagane.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_dropoff_location), '') = '' then
    raise exception 'Miejsce dostawy jest wymagane.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_vehicle_info), '') = '' then
    raise exception 'Dane pojazdu są wymagane.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_phone), '') = '' then
    raise exception 'Telefon jest wymagany.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_email), '') = '' then
    raise exception 'Email jest wymagany.' using errcode = 'P0001';
  end if;

  insert into public.tow_requests (
    user_id,
    pickup_location,
    dropoff_location,
    vehicle_info,
    phone,
    email,
    message,
    status
  )
  values (
    auth.uid(),
    trim(p_pickup_location),
    trim(p_dropoff_location),
    trim(p_vehicle_info),
    trim(p_phone),
    lower(trim(p_email)),
    nullif(trim(coalesce(p_message, '')), ''),
    'new'
  )
  returning * into v_request;

  insert into public.notification_events (type, related_entity_type, related_entity_id)
  values ('new_tow_request', 'tow_request', v_request.id::text);

  return v_request;
end;
$$;

revoke execute on function public.create_tow_request(text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.create_tow_request(text, text, text, text, text, text) to anon, authenticated;

drop function if exists public.admin_update_rental_request(uuid, text, text);

create or replace function public.admin_update_rental_request(
  p_request_id uuid,
  p_status text,
  p_admin_note text default null
)
returns public.rental_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.rental_requests%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Brak uprawnień administratora.' using errcode = '42501';
  end if;

  if p_status not in ('new', 'contacted', 'priced', 'accepted', 'rejected', 'closed') then
    raise exception 'Nieobsługiwany status zapytania.' using errcode = 'P0001';
  end if;

  update public.rental_requests
  set status = p_status,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), '')
  where id = p_request_id
  returning * into v_request;

  if not found then
    raise exception 'Zapytanie o wynajem nie istnieje.' using errcode = 'P0001';
  end if;

  return v_request;
end;
$$;

revoke execute on function public.admin_update_rental_request(uuid, text, text) from public, anon, authenticated;
grant execute on function public.admin_update_rental_request(uuid, text, text) to authenticated;

drop function if exists public.admin_update_tow_request(uuid, text, numeric, text);

create or replace function public.admin_update_tow_request(
  p_request_id uuid,
  p_status text,
  p_estimated_price numeric default null,
  p_admin_note text default null
)
returns public.tow_requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.tow_requests%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Brak uprawnień administratora.' using errcode = '42501';
  end if;

  if p_status not in ('new', 'contacted', 'priced', 'accepted', 'rejected', 'closed') then
    raise exception 'Nieobsługiwany status zapytania.' using errcode = 'P0001';
  end if;

  if p_estimated_price is not null and p_estimated_price < 0 then
    raise exception 'Szacowana cena nie może być ujemna.' using errcode = 'P0001';
  end if;

  update public.tow_requests
  set status = p_status,
      estimated_price = p_estimated_price,
      admin_note = nullif(trim(coalesce(p_admin_note, '')), '')
  where id = p_request_id
  returning * into v_request;

  if not found then
    raise exception 'Zapytanie o lawetę nie istnieje.' using errcode = 'P0001';
  end if;

  return v_request;
end;
$$;

revoke execute on function public.admin_update_tow_request(uuid, text, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_update_tow_request(uuid, text, numeric, text) to authenticated;

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
  v_price_per_seat numeric(10,2);
  v_currency text;
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

  select price_per_seat, currency
  into v_price_per_seat, v_currency
  from public.trip_prices
  where route = v_trip.route;

  v_price_per_seat := coalesce(v_price_per_seat, 0);
  v_currency := coalesce(v_currency, 'PLN');

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
    terms_version,
    price_per_seat_snapshot,
    total_price_snapshot,
    currency
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
    nullif(trim(coalesce(p_terms_version, '')), ''),
    v_price_per_seat,
    v_price_per_seat,
    v_currency
  )
  returning * into v_reservation;

  insert into public.notification_events (type, related_entity_type, related_entity_id)
  values ('new_reservation', 'reservation', v_reservation.id);

  return v_reservation;
end;
$$;

revoke execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) to authenticated;

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

  insert into public.notification_events (type, related_entity_type, related_entity_id)
  values ('reservation_cancelled_by_user', 'reservation', v_reservation.id);

  return v_reservation;
end;
$$;

revoke execute on function public.cancel_own_reservation(text) from public, anon, authenticated;
grant execute on function public.cancel_own_reservation(text) to authenticated;
