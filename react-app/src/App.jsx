import React from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.jsx';
import { ADMIN_ROLES, BLOCKING_RESERVATION_STATUSES, CONTACT_PHONE_DISPLAY, CONTACT_PHONE_HREF, MONTHS, MAX_SEATS, TERMS_VERSION } from './data/constants.js';
import { ROUTE_DETAILS } from './data/routeDetails.js';
import { BUS_DETAILS } from './data/vehicles.js';
import { useAuth } from './hooks/useAuth.js';
import { dateOnly, formatDate, monthRange, todayStr } from './lib/date.js';
import { AUTH_REDIRECTS, CONTACT_EMAIL, ENV_ERROR, sb } from './lib/supabase.js';
import { lastStop, normalizeTrips, tripDate, tripFreeSeats, tripMaxSeats, tripUsedSeats } from './lib/trips.js';
import { field, validateEmail, validatePhone, validateRequired, validateSeats } from './lib/validation.js';
import { AdminPage } from './pages/AdminPage.jsx';
import { AuthPage } from './pages/AuthPage.jsx';
import { BookingPage } from './pages/BookingPage.jsx';
import { ContactPage } from './pages/ContactPage.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { MyReservationsPage } from './pages/MyReservationsPage.jsx';
import { RentalPage } from './pages/RentalPage.jsx';
import { ResetPasswordPage } from './pages/ResetPasswordPage.jsx';
import { TowPage } from './pages/TowPage.jsx';
import { VerifyEmailPage } from './pages/VerifyEmailPage.jsx';

function isEmailConfirmed(user) {
  return Boolean(user?.email_confirmed_at || user?.confirmed_at);
}

function reservationBlocksSeat(status) {
  return BLOCKING_RESERVATION_STATUSES.includes(status);
}

function dateMs(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : 0;
}

function currentRoutePrice(prices, route) {
  const now = Date.now();
  const routePrices = (prices || []).filter((price) => price?.route === route);
  const currentPrices = routePrices
    .filter((price) => price.active !== false)
    .filter((price) => !price.valid_from || dateMs(price.valid_from) <= now)
    .filter((price) => !price.valid_to || dateMs(price.valid_to) > now)
    .sort((a, b) => dateMs(b.valid_from || b.updated_at || b.created_at) - dateMs(a.valid_from || a.updated_at || a.created_at));
  return currentPrices[0] || routePrices[0];
}

function blockStart(block) {
  return dateOnly(block?.start_date);
}

function blockEnd(block) {
  return dateOnly(block?.end_date || block?.start_date);
}

function normalizeRentalBlocks(blocks) {
  return (blocks || [])
    .filter((block) => block?.active !== false)
    .map((block) => ({ ...block, start_date: blockStart(block), end_date: blockEnd(block) }))
    .filter((block) => block.start_date && block.end_date);
}

function rangeOverlapsRentalBlock(blocks, startDate, endDate) {
  if (!startDate || !endDate) return false;
  return (blocks || []).some((block) => startDate <= blockEnd(block) && endDate >= blockStart(block));
}

function validateRentalRange(startDate, endDate, blocks) {
  if (!startDate) return 'Wybierz datę początkową wynajmu.';
  if (!endDate) return 'Wybierz datę końcową wynajmu.';
  if (endDate < startDate) return 'Data końcowa nie może być wcześniejsza niż data początkowa.';
  if (startDate < todayStr()) return 'Data początkowa nie może być w przeszłości.';
  if (rangeOverlapsRentalBlock(blocks, startDate, endDate)) return 'Wybrany zakres zawiera niedostępny termin. Wybierz inny zakres dat.';
  return null;
}

export function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const { authReady, currentUser, currentProfile, profileError } = useAuth();

  if (ENV_ERROR || !sb) {
    return (
      <main className="error-boundary">
        <div className="card">
          <h1>Brak konfiguracji aplikacji</h1>
          <p>{ENV_ERROR || 'Brak konfiguracji Supabase.'}</p>
          <p>Uzupełnij zmienne środowiskowe `VITE_*` w Render albo w lokalnym `.env.local`.</p>
        </div>
      </main>
    );
  }

  const [authForm, setAuthForm] = React.useState('login');
  const [authMsg, setAuthMsg] = React.useState(null);
  const [authLoading, setAuthLoading] = React.useState('');

  const [selectedBus, setSelectedBus] = React.useState('bus9');
  const [rentalViewMonth, setRentalViewMonth] = React.useState(new Date());
  const [rentalRangeStart, setRentalRangeStart] = React.useState(null);
  const [rentalRangeEnd, setRentalRangeEnd] = React.useState(null);
  const [rentalBlocks, setRentalBlocks] = React.useState([]);
  const [rentalRangeError, setRentalRangeError] = React.useState(null);
  const [rentalMsg, setRentalMsg] = React.useState(null);
  const [rentalSubmitting, setRentalSubmitting] = React.useState(false);
  const [rentalLoading, setRentalLoading] = React.useState(false);
  const rentalSubmittingRef = React.useRef(false);

  const [selectedRoute, setSelectedRoute] = React.useState('JW');
  const [bookingViewMonth, setBookingViewMonth] = React.useState(new Date());
  const [cachedTrips, setCachedTrips] = React.useState([]);
  const [tripPrices, setTripPrices] = React.useState([]);
  const [selectedTripId, setSelectedTripId] = React.useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = React.useState(null);
  const [pickupStop, setPickupStop] = React.useState(ROUTE_DETAILS.JW.stops[0].name);
  const [dropoffStop, setDropoffStop] = React.useState(lastStop(ROUTE_DETAILS.JW.stops).name);
  const [bookingMsg, setBookingMsg] = React.useState(null);
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);
  const [bookingLoading, setBookingLoading] = React.useState(false);

  const [towMsg, setTowMsg] = React.useState(null);
  const [towSubmitting, setTowSubmitting] = React.useState(false);
  const [myReservations, setMyReservations] = React.useState([]);
  const [myResMsg, setMyResMsg] = React.useState(null);
  const [myReservationsLoading, setMyReservationsLoading] = React.useState(false);

  const [adminTab, setAdminTab] = React.useState('trips');
  const [adminViewMonth, setAdminViewMonth] = React.useState(new Date());
  const [selectedAdminRoute, setSelectedAdminRoute] = React.useState('JW');
  const [cachedAdminTrips, setCachedAdminTrips] = React.useState([]);
  const [adminGenMsg, setAdminGenMsg] = React.useState(null);
  const [adminTripsLoading, setAdminTripsLoading] = React.useState(false);
  const [adminReservations, setAdminReservations] = React.useState([]);
  const [adminReservationsLoading, setAdminReservationsLoading] = React.useState(false);
  const [adminReservationsMsg, setAdminReservationsMsg] = React.useState(null);
  const [adminPricesMsg, setAdminPricesMsg] = React.useState(null);
  const [adminRentalRequests, setAdminRentalRequests] = React.useState([]);
  const [adminTowRequests, setAdminTowRequests] = React.useState([]);
  const [adminRequestsLoading, setAdminRequestsLoading] = React.useState(false);
  const [adminRequestsMsg, setAdminRequestsMsg] = React.useState(null);
  const [adminBlockViewMonth, setAdminBlockViewMonth] = React.useState(new Date());
  const [selectedAdminBus, setSelectedAdminBus] = React.useState('bus9');
  const [adminRentalBlocks, setAdminRentalBlocks] = React.useState([]);
  const [adminBlockMsg, setAdminBlockMsg] = React.useState(null);
  const [adminBlocksLoading, setAdminBlocksLoading] = React.useState(false);
  const [adminBlockSubmitting, setAdminBlockSubmitting] = React.useState(false);
  const [adminBlockActionId, setAdminBlockActionId] = React.useState(null);
  const [cancelingReservationId, setCancelingReservationId] = React.useState(null);

  const routeDetails = ROUTE_DETAILS[selectedRoute];
  const selectedTrip = cachedTrips.find((trip) => trip.id === selectedTripId);
  const selectedRoutePrice = currentRoutePrice(tripPrices, selectedRoute);

  React.useEffect(() => {
    const stops = ROUTE_DETAILS[selectedRoute].stops;
    setPickupStop(stops[0].name);
    setDropoffStop(lastStop(stops).name);
    setSelectedTripId(null);
    setSelectedBookingDate(null);
    if (pathname === '/booking') loadTrips();
  }, [selectedRoute]);

  React.useEffect(() => {
    if (pathname === '/rental') loadRentalCalendarBlocks();
    if (pathname === '/booking') loadTrips();
    if (pathname === '/booking' || pathname === '/admin') loadTripPrices();
    if (pathname === '/my-reservations') loadMyReservations();
    if (pathname === '/admin') loadAdminTrips();
    if (pathname === '/admin' && adminTab === 'buses') loadAdminRentalBlocks();
    if (pathname === '/admin' && adminTab === 'res') loadAdminReservations();
    if (pathname === '/admin' && adminTab === 'requests') loadAdminRequests();
  }, [pathname, currentUser?.id]);

  React.useEffect(() => {
    setRentalRangeStart(null);
    setRentalRangeEnd(null);
    setRentalRangeError(null);
    if (pathname === '/rental') loadRentalCalendarBlocks();
  }, [selectedBus]);

  React.useEffect(() => {
    if (pathname === '/rental') loadRentalCalendarBlocks();
  }, [rentalViewMonth]);

  React.useEffect(() => {
    if (pathname === '/booking') loadTrips();
  }, [bookingViewMonth]);

  React.useEffect(() => {
    if (pathname === '/admin') loadAdminTrips();
  }, [adminViewMonth, selectedAdminRoute]);

  React.useEffect(() => {
    if (pathname === '/admin' && adminTab === 'buses') loadAdminRentalBlocks();
    if (pathname === '/admin' && adminTab === 'res') loadAdminReservations();
    if (pathname === '/admin' && adminTab === 'prices') loadTripPrices();
    if (pathname === '/admin' && adminTab === 'requests') loadAdminRequests();
  }, [adminTab, adminBlockViewMonth, selectedAdminBus]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (pathname === '/rental') loadRentalCalendarBlocks(true);
    }, 15000);
    const onVisibility = () => {
      if (!document.hidden && pathname === '/rental') loadRentalCalendarBlocks(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [pathname, selectedBus, rentalViewMonth]);

  function showPage(path) {
    navigate(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function fetchTripsWithSeats(from, to) {
    let viewQuery = sb.from('trips_with_seats').select('*').gte('date', from);
    if (to) viewQuery = viewQuery.lte('date', to);
    const viewResult = await viewQuery.order('date');
    if (!viewResult.error) return { data: normalizeTrips(viewResult.data), error: null };

    let tripsQuery = sb.from('trips').select('*').gte('date', from);
    if (to) tripsQuery = tripsQuery.lte('date', to);
    const { data: trips, error: tripsError } = await tripsQuery.order('date');
    if (tripsError) return { data: [], error: tripsError };

    const tripIds = (trips || []).map((trip) => trip.id);
    if (!tripIds.length) return { data: [], error: null };

    const { data: reservations, error: resError } = await sb
      .from('reservations')
      .select('trip_id,seats,status')
      .in('trip_id', tripIds);
    if (resError) return { data: [], error: resError };

    const usedByTrip = (reservations || []).reduce((acc, res) => {
      if (!reservationBlocksSeat(res.status)) return acc;
      acc[res.trip_id] = (acc[res.trip_id] || 0) + (Number(res.seats) || 0);
      return acc;
    }, {});
    return { data: normalizeTrips((trips || []).map((trip) => ({ ...trip, used_seats: usedByTrip[trip.id] || 0 }))), error: null };
  }

  async function loadTrips() {
    setBookingLoading(true);
    const { data, error } = await fetchTripsWithSeats(todayStr());
    setBookingLoading(false);
    if (error) {
      setBookingMsg({ type: 'err', text: `Błąd ładowania terminów: ${error.message}` });
      return;
    }
    setCachedTrips(data || []);
  }

  async function loadTripPrices() {
    const { data, error } = await sb.from('trip_prices').select('*').order('route');
    if (error) {
      if (pathname === '/booking') setBookingMsg({ type: 'err', text: `Nie udało się pobrać cen przejazdów: ${error.message}` });
      else if (pathname === '/admin') setAdminPricesMsg({ type: 'err', text: `Nie udało się pobrać cen przejazdów: ${error.message}` });
      else console.warn('trip prices load failed', error);
      return;
    }
    setTripPrices(data || []);
    if (pathname === '/admin' && adminPricesMsg?.type === 'err') setAdminPricesMsg(null);
  }

  function setRentalRange(startDate, endDate) {
    const error = validateRentalRange(startDate, endDate, rentalBlocks);
    setRentalRangeStart(startDate);
    setRentalRangeEnd(endDate);
    setRentalRangeError(error);
    if (error) setRentalMsg({ type: 'err', text: error });
    else if (rentalMsg?.type === 'err') setRentalMsg(null);
  }

  async function fetchRentalCalendarBlocks(busId, viewDate) {
    const range = monthRange(viewDate);
    const { data, error } = await sb
      .rpc('get_rental_calendar_blocks', {
        p_bus_id: busId,
        p_from: range.from,
        p_to: range.to
      });
    if (error) throw error;
    return normalizeRentalBlocks(data);
  }

  async function loadRentalCalendarBlocks(silent = false) {
    if (!silent) setRentalLoading(true);
    try {
      const data = await fetchRentalCalendarBlocks(selectedBus, rentalViewMonth);
      setRentalBlocks(data);
      const error = rentalRangeStart && rentalRangeEnd ? validateRentalRange(rentalRangeStart, rentalRangeEnd, data) : null;
      setRentalRangeError(error);
      if (error && !silent) setRentalMsg({ type: 'err', text: error });
    } catch (error) {
      if (!silent) setRentalMsg({ type: 'err', text: `Nie udało się pobrać blokad kalendarza: ${error.message}` });
      else console.warn('rental calendar refetch failed', error);
      setRentalBlocks([]);
    } finally {
      if (!silent) setRentalLoading(false);
    }
  }

  async function loadAdminRentalBlocks() {
    setAdminBlocksLoading(true);
    const range = monthRange(adminBlockViewMonth);
    const { data, error } = await sb
      .from('rental_calendar_blocks')
      .select('*')
      .eq('bus_id', selectedAdminBus)
      .eq('active', true)
      .lte('start_date', range.to)
      .gte('end_date', range.from)
      .order('start_date', { ascending: false });
    setAdminBlocksLoading(false);
    if (error) {
      setAdminBlockMsg({ type: 'err', text: `Nie udało się pobrać blokad: ${error.message}` });
      setAdminRentalBlocks([]);
      return;
    }
    setAdminRentalBlocks(normalizeRentalBlocks(data));
    if (adminBlockMsg?.type === 'err') setAdminBlockMsg(null);
  }

  async function addAdminRentalBlock(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const startDate = String(form.get('start_date') || '');
    const endDate = String(form.get('end_date') || '');
    const status = String(form.get('status') || 'unavailable');
    const publicNote = String(form.get('public_note') || '').trim();
    const validationError = !startDate ? 'Wybierz początek blokady.' : !endDate ? 'Wybierz koniec blokady.' : endDate < startDate ? 'Koniec blokady nie może być przed początkiem.' : null;
    if (validationError) {
      setAdminBlockMsg({ type: 'err', text: validationError });
      return;
    }
    setAdminBlockSubmitting(true);
    try {
      const { error } = await sb.from('rental_calendar_blocks').insert({
        id: `RB${Date.now()}${Math.random().toString(36).slice(2, 8)}`,
        bus_id: selectedAdminBus,
        start_date: startDate,
        end_date: endDate,
        status,
        public_note: publicNote || null,
        active: true
      });
      if (error) {
        setAdminBlockMsg({ type: 'err', text: `Nie udało się dodać blokady: ${error.message}` });
        return;
      }
      event.currentTarget.reset();
      setAdminBlockMsg({ type: 'ok', text: 'Blokada kalendarza została dodana.' });
      await loadAdminRentalBlocks();
      if (selectedBus === selectedAdminBus) await loadRentalCalendarBlocks(true);
    } finally {
      setAdminBlockSubmitting(false);
    }
  }

  async function deactivateAdminRentalBlock(blockId) {
    setAdminBlockActionId(blockId);
    try {
      const { error } = await sb.from('rental_calendar_blocks').update({ active: false }).eq('id', blockId);
      if (error) {
        setAdminBlockMsg({ type: 'err', text: `Nie udało się usunąć blokady: ${error.message}` });
        return;
      }
      setAdminBlockMsg({ type: 'ok', text: 'Blokada została usunięta z aktywnego kalendarza.' });
      await loadAdminRentalBlocks();
      if (selectedBus === selectedAdminBus) await loadRentalCalendarBlocks(true);
    } finally {
      setAdminBlockActionId(null);
    }
  }

  async function doLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = field(form, 'email');
    const password = String(form.get('password') || '');
    const emailError = validateEmail(email);
    if (emailError || !password) {
      setAuthMsg({ type: 'err', text: emailError || 'Hasło jest wymagane.' });
      return;
    }
    setAuthLoading('login');
    const { error } = await sb.auth.signInWithPassword({ email, password });
    setAuthLoading('');
    if (error) {
      setAuthMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAuthMsg(null);
    showPage('/');
  }

  async function doRegister(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fname = field(form, 'fname');
    const lname = field(form, 'lname');
    const email = field(form, 'email');
    const password = String(form.get('password') || '');
    const phone = field(form, 'phone');
    const validationError = validateRequired(fname, 'Imię')
      || validateRequired(lname, 'Nazwisko')
      || validateEmail(email)
      || validateRequired(password, 'Hasło')
      || validatePhone(phone);
    if (validationError) {
      setAuthMsg({ type: 'err', text: validationError });
      return;
    }
    setAuthLoading('register');
    const { error } = await sb.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: `${fname} ${lname}`, phone },
        emailRedirectTo: AUTH_REDIRECTS.verifyEmail
      }
    });
    setAuthLoading('');
    if (error) {
      setAuthMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAuthMsg({ type: 'ok', text: 'Sprawdź skrzynkę email. Wysłaliśmy link potwierdzający.' });
  }

  async function doReset(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = field(form, 'email');
    const emailError = validateEmail(email);
    if (emailError) {
      setAuthMsg({ type: 'err', text: emailError });
      return;
    }
    setAuthLoading('reset');
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: AUTH_REDIRECTS.resetPassword });
    setAuthLoading('');
    if (error) {
      setAuthMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAuthMsg({ type: 'ok', text: `Link resetujący wysłany na ${email}` });
  }

  async function signOut() {
    await sb.auth.signOut();
    showPage('/');
  }

  async function submitRentalRequest(event) {
    event.preventDefault();
    if (rentalSubmittingRef.current) return;
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const phone = field(form, 'phone');
    const email = field(form, 'email');
    const notes = field(form, 'notes');
    const validationError = validateRequired(selectedBus, 'Bus')
      || validateRentalRange(rentalRangeStart, rentalRangeEnd, rentalBlocks)
      || validatePhone(phone)
      || validateEmail(email);
    if (validationError) {
      setRentalRangeError(validateRentalRange(rentalRangeStart, rentalRangeEnd, rentalBlocks));
      setRentalMsg({ type: 'err', text: validationError });
      return;
    }
    rentalSubmittingRef.current = true;
    setRentalSubmitting(true);
    try {
      const { data: available, error: availabilityError } = await sb.rpc('rental_is_range_available', {
        p_bus_id: selectedBus,
        p_start_date: rentalRangeStart,
        p_end_date: rentalRangeEnd
      });
      if (availabilityError) {
        setRentalMsg({ type: 'err', text: `Nie udało się sprawdzić zakresu wynajmu: ${availabilityError.message}` });
        return;
      }
      if (!available) {
        setRentalRangeError('Wybrany termin jest niedostępny. Wybierz inny zakres dat.');
        setRentalMsg({ type: 'err', text: 'Wybrany termin jest niedostępny. Wybierz inny zakres dat.' });
        await loadRentalCalendarBlocks(true);
        return;
      }
      const { data: requestId, error } = await sb.rpc('create_rental_request', {
        p_bus_id: selectedBus,
        p_start_date: rentalRangeStart,
        p_end_date: rentalRangeEnd,
        p_phone: phone,
        p_email: email,
        p_message: notes || null
      });
      if (error) {
        console.error('create_rental_request failed', error);
        setRentalMsg({ type: 'err', text: `Nie udało się zapisać zapytania: ${error.message}` });
        return;
      }
      if (!requestId) console.warn('create_rental_request returned empty request id');
      try {
        formEl.reset();
      } catch (resetError) {
        console.warn('rental request form reset failed after request submit', resetError);
      }
      setRentalRangeStart(null);
      setRentalRangeEnd(null);
      setRentalRangeError(null);
      setRentalMsg({ type: 'ok', text: 'Zapytanie zostało wysłane. Skontaktujemy się z Tobą w celu potwierdzenia ceny.' });
      await loadRentalCalendarBlocks(true);
    } catch (error) {
      console.error('rental request submit failed', error);
      setRentalMsg({ type: 'err', text: 'Wystąpił błąd podczas wysyłania zapytania. Spróbuj ponownie.' });
    } finally {
      rentalSubmittingRef.current = false;
      setRentalSubmitting(false);
    }
  }

  async function submitTowRequest(event) {
    event.preventDefault();
    if (towSubmitting) return;
    const formEl = event.currentTarget;
    const form = new FormData(event.currentTarget);
    const name = field(form, 'name');
    const phone = field(form, 'phone');
    const email = field(form, 'email');
    const car = field(form, 'car');
    const state = field(form, 'state');
    const from = field(form, 'from');
    const to = field(form, 'to');
    const date = field(form, 'date');
    const direction = field(form, 'direction');
    const notes = field(form, 'notes');
    const validationError = validateRequired(name, 'Imię i nazwisko')
      || validatePhone(phone)
      || validateEmail(email)
      || validateRequired(car, 'Marka i model')
      || validateRequired(from, 'Miejsce odbioru')
      || validateRequired(to, 'Miejsce dostawy')
      || validateRequired(date, 'Preferowana data');
    if (validationError) {
      setTowMsg({ type: 'err', text: validationError });
      return;
    }
    setTowSubmitting(true);
    try {
      const { error } = await sb.rpc('create_tow_request', {
        p_pickup_location: from,
        p_dropoff_location: to,
        p_vehicle_info: `${car} | Stan: ${state} | Kierunek: ${direction} | Preferowana data: ${date}`,
        p_phone: phone,
        p_email: email,
        p_message: `Imię i nazwisko: ${name}${notes ? ` | ${notes}` : ''}`
      });
      if (error) {
        console.error('create_tow_request failed', error);
        setTowMsg({ type: 'err', text: `Nie udało się zapisać zapytania: ${error.message}` });
        return;
      }
      formEl.reset();
      setTowMsg({ type: 'ok', text: 'Zapytanie zostało wysłane. Skontaktujemy się z Tobą w celu potwierdzenia szczegółów.' });
    } catch (error) {
      console.error('tow request submit failed', error);
      setTowMsg({ type: 'err', text: 'Wystąpił błąd podczas wysyłania zapytania. Spróbuj ponownie.' });
    } finally {
      setTowSubmitting(false);
    }
  }

  function chooseStop(index, type) {
    const stop = routeDetails.stops[index];
    if (!stop) return;
    if (type === 'dropoff') setDropoffStop(stop.name);
    else setPickupStop(stop.name);
  }

  function selectBookingDay(dateStr) {
    const trip = cachedTrips.find((t) => t.route === selectedRoute && tripDate(t) === dateStr && !t.cancelled && tripFreeSeats(t) > 0);
    if (!trip) return;
    setSelectedTripId(trip.id);
    setSelectedBookingDate(dateStr);
    setBookingMsg({ type: 'ok', text: `Wybrano termin: ${formatDate(dateStr)}` });
  }

  async function submitBooking(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = field(form, 'name');
    const email = field(form, 'email');
    const phone = field(form, 'phone');
    const seats = parseInt(form.get('seats'), 10) || 0;
    const notes = field(form, 'notes');
    const pickup = field(form, 'pickup_stop') || pickupStop;
    const dropoff = field(form, 'dropoff_stop') || dropoffStop;
    const termsAccepted = form.get('terms') === 'on';
    const validationError = (!currentUser ? 'Zaloguj się, aby wysłać zgłoszenie rezerwacji.' : null)
      || (!isEmailConfirmed(currentUser) ? 'Potwierdź adres email przed wysłaniem zgłoszenia rezerwacji.' : null)
      || validateRequired(name, 'Imię i nazwisko')
      || validateEmail(email)
      || validatePhone(phone)
      || validateRequired(pickup, 'Miejsce wsiadania')
      || validateRequired(dropoff, 'Miejsce wysiadania')
      || validateSeats(seats)
      || (seats === 1 ? null : 'Przez formularz online możesz zgłosić rezerwację tylko jednego miejsca.')
      || (termsAccepted ? null : 'Akceptacja regulaminu i zasad anulowania jest wymagana.')
      || (selectedBookingDate ? null : 'Wybierz termin przejazdu.');
    if (validationError) {
      setBookingMsg({ type: 'err', text: validationError });
      return;
    }
    if (!selectedTripId) {
      setBookingMsg({ type: 'err', text: 'Wybierz termin.' });
      return;
    }
    if (pickup === dropoff) {
      setBookingMsg({ type: 'err', text: 'Przystanek wsiadania i wysiadania nie może być taki sam.' });
      return;
    }
    const routeStops = routeDetails.stops.map((stop) => stop.name);
    const pickupIndex = routeStops.indexOf(pickup);
    const dropoffIndex = routeStops.indexOf(dropoff);
    if (pickupIndex >= 0 && dropoffIndex >= 0 && pickupIndex > dropoffIndex) {
      setBookingMsg({ type: 'err', text: 'Wybierz wysiadanie dalej na trasie niż miejsce wsiadania.' });
      return;
    }
    if (!selectedTrip || selectedTrip.cancelled) {
      setBookingMsg({ type: 'err', text: 'Ten kurs jest odwołany.' });
      return;
    }
    if (tripFreeSeats(selectedTrip) < seats) {
      setBookingMsg({ type: 'err', text: `Dostępnych miejsc: ${tripFreeSeats(selectedTrip)}. Zmień liczbę.` });
      return;
    }

    setBookingSubmitting(true);
    const stopNotes = [
      `Wsiadam: ${pickup}`,
      `Wysiadam: ${dropoff}`,
      notes ? `Uwagi klienta: ${notes}` : null
    ].filter(Boolean).join('\n');
    const { data, error } = await sb.rpc('create_reservation_request', {
      p_trip_id: selectedTripId,
      p_passenger_name: name,
      p_passenger_phone: phone,
      p_notes: stopNotes,
      p_terms_accepted: termsAccepted,
      p_terms_version: TERMS_VERSION
    });
    setBookingSubmitting(false);
    if (error) {
      await loadTrips();
      setBookingMsg({ type: 'err', text: `Błąd rezerwacji: ${error.message}` });
      return;
    }
    setSelectedTripId(null);
    setSelectedBookingDate(null);
    event.currentTarget.reset();
    await loadTrips();
    setBookingMsg({ type: 'ok', text: `Zgłoszenie rezerwacji wysłane. Admin potwierdzi dostępność. Nr: ${data?.id || data || 'nadany w systemie'}` });
  }

  async function loadMyReservations() {
    if (!currentUser) {
      setMyReservations([]);
      return;
    }
    setMyReservationsLoading(true);
    const { data, error } = await sb
      .from('reservations')
      .select('*,trips(route,date,cancelled)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
    setMyReservationsLoading(false);
    if (error) {
      setMyResMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setMyReservations(data || []);
  }

  async function cancelReservation(resId) {
    if (cancelingReservationId) return;
    if (!window.confirm('Czy na pewno chcesz anulować tę rezerwację?')) return;
    setCancelingReservationId(resId);
    setMyResMsg({ type: 'info', text: 'Anulowanie rezerwacji...' });
    try {
      const { error } = await sb.rpc('cancel_own_reservation', { p_reservation_id: resId });
      if (error) {
        setMyResMsg({ type: 'err', text: `Nie udało się anulować rezerwacji: ${error.message}` });
        return;
      }
      setMyResMsg({ type: 'ok', text: 'Rezerwacja została anulowana.' });
      await loadMyReservations();
    } finally {
      setCancelingReservationId(null);
    }
  }

  async function loadAdminTrips() {
    setAdminTripsLoading(true);
    const range = monthRange(adminViewMonth);
    const { data, error } = await fetchTripsWithSeats(range.from, range.to);
    setAdminTripsLoading(false);
    if (error) {
      setAdminGenMsg({ type: 'err', text: `Błąd ładowania: ${error.message}` });
      return;
    }
    setCachedAdminTrips(data || []);
  }

  async function toggleAdminTripDate(dateStr) {
    const trip = cachedAdminTrips.find((item) => item.route === selectedAdminRoute && tripDate(item) === dateStr);
    if (trip) {
      const { error } = await sb.from('trips').update({ cancelled: !trip.cancelled }).eq('id', trip.id);
      if (error) {
        setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
        return;
      }
      setAdminGenMsg({ type: 'ok', text: trip.cancelled ? 'Kurs został przywrócony.' : 'Kurs został odwołany.' });
    } else {
      const id = `T${dateStr.replace(/-/g, '')}${selectedAdminRoute}`;
      const { error } = await sb.from('trips').insert({ id, route: selectedAdminRoute, date: dateStr, cancelled: false, max_seats: MAX_SEATS });
      if (error) {
        setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
        return;
      }
      setAdminGenMsg({ type: 'ok', text: 'Kurs został dodany.' });
    }
    await loadAdminTrips();
  }

  async function toggleTrip(id, cancel) {
    if (cancel && !window.confirm('Odwołać ten kurs?')) return;
    const { error } = await sb.from('trips').update({ cancelled: cancel }).eq('id', id);
    if (error) {
      setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAdminGenMsg({ type: 'ok', text: cancel ? 'Kurs został odwołany.' : 'Kurs został przywrócony.' });
    await loadAdminTrips();
  }

  async function generateMonth() {
    const year = adminViewMonth.getFullYear();
    const month = adminViewMonth.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const from = `${year}-${monthStr}-01`;
    const last = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${monthStr}-${String(last).padStart(2, '0')}`;
    const { data: existing } = await sb.from('trips').select('id').gte('date', from).lte('date', to);
    if (existing?.length) {
      setAdminGenMsg({ type: 'err', text: `Terminy na ${MONTHS[month]} ${year} już istnieją (${existing.length} kursów).` });
      return;
    }
    const newTrips = [];
    for (let day = 1; day <= last; day += 1) {
      const date = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
      const dow = new Date(year, month, day).getDay();
      if (dow === 0) newTrips.push({ id: `T${year}${monthStr}${String(day).padStart(2, '0')}JW`, route: 'JW', date, cancelled: false, max_seats: MAX_SEATS });
      if (dow === 5) newTrips.push({ id: `T${year}${monthStr}${String(day).padStart(2, '0')}WJ`, route: 'WJ', date, cancelled: false, max_seats: MAX_SEATS });
    }
    const { error } = await sb.from('trips').insert(newTrips);
    if (error) {
      setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAdminGenMsg({ type: 'ok', text: `Wystawiono ${newTrips.length} terminów na ${MONTHS[month]} ${year}.` });
    await loadAdminTrips();
  }

  async function loadAdminReservations() {
    setAdminReservationsLoading(true);
    const { data, error } = await sb.from('reservations').select('*,trips(route,date,cancelled),payments(*)').order('created_at', { ascending: false });
    setAdminReservationsLoading(false);
    if (error) {
      setAdminReservations([]);
      setAdminReservationsMsg({ type: 'err', text: `Nie udało się pobrać rezerwacji: ${error.message}` });
      return;
    }
    setAdminReservations(data || []);
    if (adminReservationsMsg?.type === 'err' && !adminReservationsMsg.resId) setAdminReservationsMsg(null);
  }

  async function adminSetTripPrice(route, pricePerSeat, currency) {
    const { error } = await sb.rpc('admin_set_trip_price', {
      p_route: route,
      p_price_per_seat: pricePerSeat,
      p_currency: currency
    });
    if (error) {
      setAdminPricesMsg({ type: 'err', route, text: `Nie udało się zapisać ceny: ${error.message}` });
      return false;
    }
    setAdminPricesMsg({ type: 'ok', route, text: 'Cena przejazdu została zapisana.' });
    await loadTripPrices();
    return true;
  }

  async function adminSetPaymentStatus(resId, status, method, amount, currency, note) {
    const { error } = await sb.rpc('admin_set_payment_status', {
      p_reservation_id: resId,
      p_status: status,
      p_method: method,
      p_amount: amount,
      p_currency: currency,
      p_note: note
    });
    if (error) {
      setAdminReservationsMsg({ type: 'err', resId, text: `Nie udało się zapisać płatności: ${error.message}` });
      return false;
    }
    setAdminReservationsMsg({ type: 'ok', resId, text: 'Status płatności został zapisany.' });
    await loadAdminReservations();
    return true;
  }

  async function adminSetReservationStatus(resId, status) {
    const { error } = await sb.rpc('admin_set_reservation_status', {
      p_reservation_id: resId,
      p_new_status: status
    });
    if (error) {
      setAdminReservationsMsg({ type: 'err', resId, text: `Nie udało się zmienić statusu rezerwacji: ${error.message}` });
      return false;
    }
    setAdminReservationsMsg({ type: 'ok', resId, text: 'Status rezerwacji został zmieniony.' });
    await loadAdminReservations();
    await loadAdminTrips();
    return true;
  }

  async function loadAdminRequests() {
    setAdminRequestsLoading(true);
    const [rentalResult, towResult] = await Promise.all([
      sb.from('rental_requests').select('*').order('created_at', { ascending: false }),
      sb.from('tow_requests').select('*').order('created_at', { ascending: false })
    ]);
    setAdminRequestsLoading(false);
    if (rentalResult.error || towResult.error) {
      setAdminRequestsMsg({ type: 'err', text: `Nie udało się pobrać zapytań: ${rentalResult.error?.message || towResult.error?.message}` });
      return;
    }
    setAdminRentalRequests(rentalResult.data || []);
    setAdminTowRequests(towResult.data || []);
    if (adminRequestsMsg?.type === 'err' && !adminRequestsMsg.requestId) setAdminRequestsMsg(null);
  }

  async function adminUpdateRentalRequest(requestId, status, adminNote) {
    const { error } = await sb.rpc('admin_update_rental_request', {
      p_request_id: requestId,
      p_status: status,
      p_admin_note: adminNote
    });
    if (error) {
      setAdminRequestsMsg({ type: 'err', requestId, kind: 'rental', text: `Nie udało się zapisać zapytania o wynajem: ${error.message}` });
      return false;
    }
    setAdminRequestsMsg({ type: 'ok', requestId, kind: 'rental', text: 'Zapytanie o wynajem zostało zaktualizowane.' });
    await loadAdminRequests();
    return true;
  }

  async function adminUpdateTowRequest(requestId, status, estimatedPrice, adminNote) {
    const { error } = await sb.rpc('admin_update_tow_request', {
      p_request_id: requestId,
      p_status: status,
      p_estimated_price: estimatedPrice,
      p_admin_note: adminNote
    });
    if (error) {
      setAdminRequestsMsg({ type: 'err', requestId, kind: 'tow', text: `Nie udało się zapisać zapytania o lawetę: ${error.message}` });
      return false;
    }
    setAdminRequestsMsg({ type: 'ok', requestId, kind: 'tow', text: 'Zapytanie o lawetę zostało zaktualizowane.' });
    await loadAdminRequests();
    return true;
  }

  const navItems = [
    ['/', 'Start'],
    ['/rental', 'Busy'],
    ['/booking', 'Przejazdy'],
    ['/tow', 'Laweta'],
    ['/my-reservations', 'Rezerwacje'],
    ['/contact', 'Kontakt']
  ];

  return (
    <div className="site">
      <nav className="nav">
        <NavLink className="nav-logo" to="/">
          <span className="nav-logo-main">Wynajem Busów</span>
          <span>Jarosław - Polska/Austria</span>
        </NavLink>
        <div className="nav-tabs">
          {navItems.map(([to, label]) => (
            <NavLink key={to} to={to} end={to === '/'} className={({ isActive }) => `tab-btn ${isActive ? 'active' : ''}`}>{label}</NavLink>
          ))}
          {ADMIN_ROLES.includes(currentProfile?.role) ? (
            <NavLink to="/admin" className={({ isActive }) => `tab-btn admin-link ${isActive ? 'active' : ''}`}>Panel</NavLink>
          ) : null}
        </div>
        <div className="nav-contact">
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE_DISPLAY}</a>
        </div>
        <div className="nav-account">
          {currentUser ? (
            <details className="user-menu">
              <summary>
                <span>Status konta</span>
                <strong>Zalogowany</strong>
              </summary>
              <button onClick={signOut} type="button">Wyloguj</button>
            </details>
          ) : (
            <NavLink to="/auth" className="account-link">Niezalogowany</NavLink>
          )}
        </div>
      </nav>

      {profileError ? <div className="user-bar err">Nie udało się pobrać profilu: {profileError}</div> : null}

      <Routes>
        <Route path="/" element={<HomePage showPage={showPage} currentUser={currentUser} contactEmail={CONTACT_EMAIL} contactPhone={CONTACT_PHONE_DISPLAY} contactPhoneHref={CONTACT_PHONE_HREF} />} />
        <Route path="/rental" element={<RentalPage selectedBus={selectedBus} setSelectedBus={setSelectedBus} rentalViewMonth={rentalViewMonth} setRentalViewMonth={setRentalViewMonth} rentalBlocks={rentalBlocks} rentalRangeStart={rentalRangeStart} rentalRangeEnd={rentalRangeEnd} setRentalRange={setRentalRange} rentalRangeError={rentalRangeError} submitRentalRequest={submitRentalRequest} rentalMsg={rentalMsg} rentalSubmitting={rentalSubmitting} rentalLoading={rentalLoading} currentUser={currentUser} contactPhone={CONTACT_PHONE_DISPLAY} contactPhoneHref={CONTACT_PHONE_HREF} />} />
        <Route path="/auth" element={<AuthPage authForm={authForm} setAuthForm={setAuthForm} authMsg={authMsg} authLoading={authLoading} doLogin={doLogin} doRegister={doRegister} doReset={doReset} />} />
        <Route path="/booking" element={<BookingPage selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute} routeDetails={routeDetails} bookingViewMonth={bookingViewMonth} setBookingViewMonth={setBookingViewMonth} cachedTrips={cachedTrips} selectedTripId={selectedTripId} selectedBookingDate={selectedBookingDate} selectBookingDay={selectBookingDay} pickupStop={pickupStop} dropoffStop={dropoffStop} setPickupStop={setPickupStop} setDropoffStop={setDropoffStop} chooseStop={chooseStop} submitBooking={submitBooking} bookingMsg={bookingMsg} bookingSubmitting={bookingSubmitting} bookingLoading={bookingLoading} currentUser={currentUser} currentProfile={currentProfile} tripPrice={selectedRoutePrice} />} />
        <Route path="/tow" element={<TowPage towMsg={towMsg} submitTowRequest={submitTowRequest} towSubmitting={towSubmitting} currentUser={currentUser} contactPhone={CONTACT_PHONE_DISPLAY} contactPhoneHref={CONTACT_PHONE_HREF} />} />
        <Route path="/my-reservations" element={<MyReservationsPage currentUser={currentUser} showPage={showPage} myReservations={myReservations} myResMsg={myResMsg} myReservationsLoading={myReservationsLoading} cancelReservation={cancelReservation} cancelingReservationId={cancelingReservationId} />} />
        <Route path="/contact" element={<ContactPage contactEmail={CONTACT_EMAIL} contactPhone={CONTACT_PHONE_DISPLAY} contactPhoneHref={CONTACT_PHONE_HREF} />} />
        <Route path="/admin" element={<ProtectedAdminRoute authReady={authReady} currentProfile={currentProfile}><AdminPage adminTab={adminTab} setAdminTab={setAdminTab} adminViewMonth={adminViewMonth} setAdminViewMonth={setAdminViewMonth} selectedAdminRoute={selectedAdminRoute} setSelectedAdminRoute={setSelectedAdminRoute} cachedAdminTrips={cachedAdminTrips} toggleAdminTripDate={toggleAdminTripDate} generateMonth={generateMonth} adminGenMsg={adminGenMsg} toggleTrip={toggleTrip} adminTripsLoading={adminTripsLoading} adminReservations={adminReservations} adminReservationsLoading={adminReservationsLoading} adminReservationsMsg={adminReservationsMsg} adminSetReservationStatus={adminSetReservationStatus} adminSetPaymentStatus={adminSetPaymentStatus} tripPrices={tripPrices} adminPricesMsg={adminPricesMsg} adminSetTripPrice={adminSetTripPrice} adminRentalRequests={adminRentalRequests} adminTowRequests={adminTowRequests} adminRequestsLoading={adminRequestsLoading} adminRequestsMsg={adminRequestsMsg} adminUpdateRentalRequest={adminUpdateRentalRequest} adminUpdateTowRequest={adminUpdateTowRequest} adminBlockViewMonth={adminBlockViewMonth} setAdminBlockViewMonth={setAdminBlockViewMonth} selectedAdminBus={selectedAdminBus} setSelectedAdminBus={setSelectedAdminBus} adminRentalBlocks={adminRentalBlocks} adminBlockMsg={adminBlockMsg} adminBlocksLoading={adminBlocksLoading} adminBlockSubmitting={adminBlockSubmitting} adminBlockActionId={adminBlockActionId} addAdminRentalBlock={addAdminRentalBlock} deactivateAdminRentalBlock={deactivateAdminRentalBlock} /></ProtectedAdminRoute>} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <strong>Wynajem Busów Jarosław</strong>
            <span>Przejazdy Jarosław-Wiedeń, wynajem busów i transport lawetą na trasie Polska-Austria.</span>
          </div>
          <div className="footer-col">
            <span>Trasa</span>
            <NavLink to="/booking">Jarosław-Wiedeń</NavLink>
            <NavLink to="/tow">Polska-Austria</NavLink>
          </div>
          <div className="footer-col">
            <span>Usługi</span>
            <NavLink to="/rental">Wynajem busów</NavLink>
            <NavLink to="/tow">Transport lawetą</NavLink>
          </div>
          <div className="footer-col">
            <span>Kontakt</span>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <a href={CONTACT_PHONE_HREF}>{CONTACT_PHONE_DISPLAY}</a>
            <NavLink to="/contact">Zapytania i informacje</NavLink>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Wynajem Busów Jarosław. Wszelkie prawa zastrzeżone.</div>
      </footer>
    </div>
  );
}
