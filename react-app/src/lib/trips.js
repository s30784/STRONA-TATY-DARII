import { MAX_SEATS } from '../data/constants.js';
import { dateOnly } from './date.js';

export function tripDate(trip) {
  return dateOnly(trip?.date);
}

export function tripMaxSeats(trip) {
  const seats = Number(trip?.max_seats);
  return Number.isFinite(seats) && seats > 0 ? seats : MAX_SEATS;
}

export function tripUsedSeats(trip) {
  const seats = Number(trip?.used_seats);
  return Number.isFinite(seats) && seats > 0 ? seats : 0;
}

export function tripFreeSeats(trip) {
  const free = Number(trip?.free_seats);
  if (Number.isFinite(free)) return Math.max(0, free);
  return Math.max(0, tripMaxSeats(trip) - tripUsedSeats(trip));
}

export function normalizeTrips(trips) {
  return (trips || []).map((trip) => ({
    ...trip,
    date: tripDate(trip),
    max_seats: tripMaxSeats(trip),
    used_seats: tripUsedSeats(trip),
    free_seats: tripFreeSeats(trip)
  }));
}

export function lastStop(stops) {
  return stops[stops.length - 1];
}
