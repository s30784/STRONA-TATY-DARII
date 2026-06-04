create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'user',
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_role_check check (role in ('user', 'admin'))
);

create table if not exists public.trips (
  id text primary key,
  route text not null,
  date date not null,
  cancelled boolean not null default false,
  max_seats integer not null default 7,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint trips_route_check check (route in ('JW', 'WJ')),
  constraint trips_max_seats_check check (max_seats > 0),
  constraint trips_route_date_unique unique (route, date)
);

create table if not exists public.reservations (
  id text primary key,
  trip_id text not null references public.trips(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  passenger_name text not null,
  passenger_email text not null,
  passenger_phone text,
  seats integer not null,
  notes text,
  status text not null default 'confirmed',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint reservations_status_check check (status in ('confirmed', 'cancelled')),
  constraint reservations_seats_check check (seats > 0)
);

create index if not exists reservations_trip_id_idx on public.reservations(trip_id);
create index if not exists reservations_user_id_idx on public.reservations(user_id);

create table if not exists public.bus_availability (
  bus_id text not null,
  date date not null,
  available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bus_id, date),
  constraint bus_availability_bus_id_check check (bus_id in ('bus9', 'bus8'))
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trips_set_updated_at on public.trips;
create trigger trips_set_updated_at
before update on public.trips
for each row execute function public.set_updated_at();

drop trigger if exists reservations_set_updated_at on public.reservations;
create trigger reservations_set_updated_at
before update on public.reservations
for each row execute function public.set_updated_at();

drop trigger if exists bus_availability_set_updated_at on public.bus_availability;
create trigger bus_availability_set_updated_at
before update on public.bus_availability
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, phone)
  values (new.id, new.raw_user_meta_data ->> 'phone')
  on conflict (id) do update
    set phone = excluded.phone;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();
