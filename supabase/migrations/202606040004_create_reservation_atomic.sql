create or replace function public.create_reservation_atomic(
  p_trip_id text,
  p_passenger_name text,
  p_passenger_email text,
  p_passenger_phone text,
  p_seats integer,
  p_notes text default null,
  p_user_id uuid default null
)
returns public.reservations
language plpgsql
security definer
set search_path = public
as $$
declare
  v_trip public.trips%rowtype;
  v_used_seats integer;
  v_reservation public.reservations%rowtype;
begin
  if coalesce(trim(p_trip_id), '') = '' then
    raise exception 'Brak identyfikatora kursu.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_passenger_name), '') = '' then
    raise exception 'Imię i nazwisko jest wymagane.' using errcode = 'P0001';
  end if;

  if coalesce(trim(p_passenger_email), '') = '' then
    raise exception 'Email jest wymagany.' using errcode = 'P0001';
  end if;

  if p_seats is null or p_seats <= 0 then
    raise exception 'Liczba miejsc musi być większa od 0.' using errcode = 'P0001';
  end if;

  if p_user_id is not null and auth.uid() is not null and p_user_id <> auth.uid() and not public.is_admin() then
    raise exception 'Nie możesz utworzyć rezerwacji dla innego użytkownika.' using errcode = '42501';
  end if;

  if p_user_id is not null and auth.uid() is null then
    raise exception 'Nieprawidłowy użytkownik rezerwacji.' using errcode = '42501';
  end if;

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

  select coalesce(sum(seats), 0)::integer
  into v_used_seats
  from public.reservations
  where trip_id = p_trip_id
    and status <> 'cancelled';

  if v_used_seats + p_seats > v_trip.max_seats then
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
    status
  )
  values (
    'R' || replace(gen_random_uuid()::text, '-', ''),
    p_trip_id,
    p_user_id,
    trim(p_passenger_name),
    lower(trim(p_passenger_email)),
    nullif(trim(coalesce(p_passenger_phone, '')), ''),
    p_seats,
    nullif(trim(coalesce(p_notes, '')), ''),
    'confirmed'
  )
  returning * into v_reservation;

  return v_reservation;
end;
$$;

grant execute on function public.create_reservation_atomic(text, text, text, text, integer, text, uuid) to anon, authenticated;
