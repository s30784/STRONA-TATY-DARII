alter table public.reservations
  add column if not exists price_per_seat_snapshot numeric(10,2),
  add column if not exists total_price_snapshot numeric(10,2),
  add column if not exists currency text not null default 'PLN';

create table if not exists public.trip_prices (
  route text primary key,
  price_per_seat numeric(10,2) not null default 0,
  currency text not null default 'PLN',
  updated_by_admin_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trip_prices_route_check check (route in ('JW', 'WJ')),
  constraint trip_prices_price_check check (price_per_seat >= 0),
  constraint trip_prices_currency_check check (currency in ('PLN', 'EUR'))
);

insert into public.trip_prices (route, price_per_seat, currency)
values
  ('JW', 0, 'PLN'),
  ('WJ', 0, 'PLN')
on conflict (route) do nothing;

drop trigger if exists trip_prices_set_updated_at on public.trip_prices;
create trigger trip_prices_set_updated_at
before update on public.trip_prices
for each row execute function public.set_updated_at();

alter table public.trip_prices enable row level security;

drop policy if exists trip_prices_select_public on public.trip_prices;
create policy trip_prices_select_public
on public.trip_prices
for select
to anon, authenticated
using (true);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id text not null references public.reservations(id) on delete cascade,
  amount numeric(10,2) not null default 0,
  currency text not null default 'PLN',
  method text not null default 'cash',
  status text not null default 'unpaid',
  paid_at timestamptz,
  confirmed_by_admin_id uuid references auth.users(id) on delete set null,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint payments_amount_check check (amount >= 0),
  constraint payments_currency_check check (currency in ('PLN', 'EUR')),
  constraint payments_method_check check (method in ('cash', 'blik', 'bank_transfer', 'other')),
  constraint payments_status_check check (status in ('unpaid', 'pending', 'paid', 'refunded', 'cancelled'))
);

create index if not exists payments_reservation_id_idx on public.payments(reservation_id);

drop trigger if exists payments_set_updated_at on public.payments;
create trigger payments_set_updated_at
before update on public.payments
for each row execute function public.set_updated_at();

alter table public.payments enable row level security;

drop policy if exists payments_admin_select on public.payments;
create policy payments_admin_select
on public.payments
for select
to authenticated
using (public.is_admin());

drop policy if exists payments_admin_insert on public.payments;
create policy payments_admin_insert
on public.payments
for insert
to authenticated
with check (public.is_admin());

drop policy if exists payments_admin_update on public.payments;
create policy payments_admin_update
on public.payments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

update public.reservations r
set price_per_seat_snapshot = coalesce(r.price_per_seat_snapshot, tp.price_per_seat),
    total_price_snapshot = coalesce(r.total_price_snapshot, tp.price_per_seat * r.seats),
    currency = coalesce(nullif(r.currency, ''), tp.currency)
from public.trips t
join public.trip_prices tp on tp.route = t.route
where r.trip_id = t.id;

drop function if exists public.admin_set_trip_price(text, numeric, text);

create or replace function public.admin_set_trip_price(
  p_route text,
  p_price_per_seat numeric,
  p_currency text default 'PLN'
)
returns public.trip_prices
language plpgsql
security definer
set search_path = public
as $$
declare
  v_price public.trip_prices%rowtype;
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Brak uprawnień administratora.' using errcode = '42501';
  end if;

  if p_route not in ('JW', 'WJ') then
    raise exception 'Nieobsługiwana trasa: %.', p_route using errcode = 'P0001';
  end if;

  if p_price_per_seat is null or p_price_per_seat < 0 then
    raise exception 'Cena musi być liczbą nieujemną.' using errcode = 'P0001';
  end if;

  if coalesce(p_currency, '') not in ('PLN', 'EUR') then
    raise exception 'Nieobsługiwana waluta: %.', p_currency using errcode = 'P0001';
  end if;

  insert into public.trip_prices (route, price_per_seat, currency, updated_by_admin_id)
  values (p_route, p_price_per_seat, p_currency, auth.uid())
  on conflict (route) do update
    set price_per_seat = excluded.price_per_seat,
        currency = excluded.currency,
        updated_by_admin_id = excluded.updated_by_admin_id
  returning * into v_price;

  return v_price;
end;
$$;

revoke execute on function public.admin_set_trip_price(text, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_set_trip_price(text, numeric, text) to authenticated;

drop function if exists public.admin_set_payment_status(text, text, text, numeric, text);

create or replace function public.admin_set_payment_status(
  p_reservation_id text,
  p_status text,
  p_method text default 'cash',
  p_amount numeric default null,
  p_note text default null
)
returns public.payments
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_payment public.payments%rowtype;
  v_amount numeric(10,2);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Brak uprawnień administratora.' using errcode = '42501';
  end if;

  if p_status not in ('unpaid', 'pending', 'paid', 'refunded', 'cancelled') then
    raise exception 'Nieobsługiwany status płatności: %.', p_status using errcode = 'P0001';
  end if;

  if coalesce(p_method, '') not in ('cash', 'blik', 'bank_transfer', 'other') then
    raise exception 'Nieobsługiwana metoda płatności: %.', p_method using errcode = 'P0001';
  end if;

  select *
  into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if not found then
    raise exception 'Rezerwacja nie istnieje.' using errcode = 'P0001';
  end if;

  v_amount := coalesce(p_amount, v_reservation.total_price_snapshot, 0);

  if v_amount < 0 then
    raise exception 'Kwota płatności nie może być ujemna.' using errcode = 'P0001';
  end if;

  select *
  into v_payment
  from public.payments
  where reservation_id = p_reservation_id
  order by created_at desc
  limit 1
  for update;

  if found then
    update public.payments
    set amount = v_amount,
        currency = coalesce(v_reservation.currency, 'PLN'),
        method = p_method,
        status = p_status,
        paid_at = case when p_status = 'paid' then coalesce(paid_at, now()) else null end,
        confirmed_by_admin_id = case when p_status = 'paid' then auth.uid() else null end,
        note = nullif(trim(coalesce(p_note, '')), '')
    where id = v_payment.id
    returning * into v_payment;
  else
    insert into public.payments (
      reservation_id,
      amount,
      currency,
      method,
      status,
      paid_at,
      confirmed_by_admin_id,
      note
    )
    values (
      p_reservation_id,
      v_amount,
      coalesce(v_reservation.currency, 'PLN'),
      p_method,
      p_status,
      case when p_status = 'paid' then now() else null end,
      case when p_status = 'paid' then auth.uid() else null end,
      nullif(trim(coalesce(p_note, '')), '')
    )
    returning * into v_payment;
  end if;

  return v_payment;
end;
$$;

revoke execute on function public.admin_set_payment_status(text, text, text, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_set_payment_status(text, text, text, numeric, text) to authenticated;

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

  return v_reservation;
end;
$$;

revoke execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) from public, anon, authenticated;
grant execute on function public.create_reservation_request(text, text, text, text, integer, text, boolean, text) to authenticated;
