create or replace view public.trips_with_seats as
select
  t.id,
  t.route,
  t.date,
  t.cancelled,
  coalesce(t.max_seats, 7) as max_seats,
  coalesce(sum(r.seats) filter (where r.status <> 'cancelled'), 0)::integer as used_seats,
  greatest(
    coalesce(t.max_seats, 7) - coalesce(sum(r.seats) filter (where r.status <> 'cancelled'), 0),
    0
  )::integer as free_seats
from public.trips t
left join public.reservations r on r.trip_id = t.id
group by t.id, t.route, t.date, t.cancelled, t.max_seats;

grant select on public.trips_with_seats to anon, authenticated;
