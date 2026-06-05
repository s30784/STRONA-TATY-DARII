import React from 'react';
import { Navigate, NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ProtectedAdminRoute } from './components/ProtectedAdminRoute.jsx';
import { MONTHS, MAX_SEATS } from './data/constants.js';
import { ROUTE_DETAILS } from './data/routeDetails.js';
import { BUS_DETAILS } from './data/vehicles.js';
import { useAuth } from './hooks/useAuth.js';
import { formatDate, monthRange, todayStr } from './lib/date.js';
import { buildMailto } from './lib/mail.js';
import { AUTH_REDIRECTS, CONTACT_EMAIL, ENV_ERROR, sb } from './lib/supabase.js';
import { defaultBusAvailable, lastStop, normalizeTrips, tripDate, tripFreeSeats, tripMaxSeats, tripUsedSeats } from './lib/trips.js';
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
  const [selectedRentalDate, setSelectedRentalDate] = React.useState(null);
  const [busAvailability, setBusAvailability] = React.useState([]);
  const [busAvailabilityFallback, setBusAvailabilityFallback] = React.useState(false);
  const [rentalMsg, setRentalMsg] = React.useState(null);
  const [rentalSubmitting, setRentalSubmitting] = React.useState(false);
  const [rentalLoading, setRentalLoading] = React.useState(false);

  const [selectedRoute, setSelectedRoute] = React.useState('JW');
  const [bookingViewMonth, setBookingViewMonth] = React.useState(new Date());
  const [cachedTrips, setCachedTrips] = React.useState([]);
  const [selectedTripId, setSelectedTripId] = React.useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = React.useState(null);
  const [pickupStop, setPickupStop] = React.useState(ROUTE_DETAILS.JW.stops[0].name);
  const [dropoffStop, setDropoffStop] = React.useState(lastStop(ROUTE_DETAILS.JW.stops).name);
  const [bookingMsg, setBookingMsg] = React.useState(null);
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);
  const [bookingLoading, setBookingLoading] = React.useState(false);

  const [towMsg, setTowMsg] = React.useState(null);
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
  const [adminBusViewMonth, setAdminBusViewMonth] = React.useState(new Date());
  const [selectedAdminBus, setSelectedAdminBus] = React.useState('bus9');
  const [cachedAdminBusAvailability, setCachedAdminBusAvailability] = React.useState([]);
  const [adminBusNote, setAdminBusNote] = React.useState('Kliknij dzień, aby przełączyć dostępność busa.');
  const [adminBusLoading, setAdminBusLoading] = React.useState(false);

  const routeDetails = ROUTE_DETAILS[selectedRoute];
  const selectedTrip = cachedTrips.find((trip) => trip.id === selectedTripId);

  React.useEffect(() => {
    const stops = ROUTE_DETAILS[selectedRoute].stops;
    setPickupStop(stops[0].name);
    setDropoffStop(lastStop(stops).name);
    setSelectedTripId(null);
    setSelectedBookingDate(null);
    if (pathname === '/booking') loadTrips();
  }, [selectedRoute]);

  React.useEffect(() => {
    if (pathname === '/rental') loadRentalBusAvailability();
    if (pathname === '/booking') loadTrips();
    if (pathname === '/my-reservations') loadMyReservations();
    if (pathname === '/admin') loadAdminTrips();
    if (pathname === '/admin' && adminTab === 'buses') loadAdminBusAvailability();
    if (pathname === '/admin' && adminTab === 'res') loadAdminReservations();
  }, [pathname, currentUser?.id]);

  React.useEffect(() => {
    if (pathname === '/rental') loadRentalBusAvailability();
  }, [selectedBus, rentalViewMonth]);

  React.useEffect(() => {
    if (pathname === '/booking') loadTrips();
  }, [bookingViewMonth]);

  React.useEffect(() => {
    if (pathname === '/admin') loadAdminTrips();
  }, [adminViewMonth, selectedAdminRoute]);

  React.useEffect(() => {
    if (pathname === '/admin' && adminTab === 'buses') loadAdminBusAvailability();
    if (pathname === '/admin' && adminTab === 'res') loadAdminReservations();
  }, [adminTab, adminBusViewMonth, selectedAdminBus]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      if (pathname === '/rental') loadRentalBusAvailability(true);
    }, 15000);
    const onVisibility = () => {
      if (!document.hidden && pathname === '/rental') loadRentalBusAvailability(true);
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
      if (res.status === 'cancelled') return acc;
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

  function getCachedBusAvailability(cache, busId, dateStr) {
    const row = (cache || []).find((item) => item.bus_id === busId && item.date === dateStr);
    if (row) return row.available !== false;
    return defaultBusAvailable(dateStr);
  }

  async function fetchBusAvailability(busId, viewDate) {
    const range = monthRange(viewDate);
    const { data, error } = await sb
      .from('bus_availability')
      .select('*')
      .eq('bus_id', busId)
      .gte('date', range.from)
      .lte('date', range.to);
    if (error) {
      setBusAvailabilityFallback(true);
      return [];
    }
    setBusAvailabilityFallback(false);
    return data || [];
  }

  async function fetchBusAvailabilityForDate(busId, dateStr) {
    const { data, error } = await sb
      .from('bus_availability')
      .select('available')
      .eq('bus_id', busId)
      .eq('date', dateStr)
      .maybeSingle();
    if (error) throw error;
    return data ? data.available !== false : defaultBusAvailable(dateStr);
  }

  async function loadRentalBusAvailability(silent = false) {
    if (!silent) setRentalLoading(true);
    const data = await fetchBusAvailability(selectedBus, rentalViewMonth);
    if (!silent) setRentalLoading(false);
    setBusAvailability(data);
    if (selectedRentalDate && (!getCachedBusAvailability(data, selectedBus, selectedRentalDate) || selectedRentalDate < todayStr())) {
      setSelectedRentalDate(null);
      if (!silent) setRentalMsg({ type: 'err', text: 'Wybrany termin jest już niedostępny. Wybierz inny dzień.' });
    }
  }

  async function saveBusAvailability(busId, dateStr, available) {
    const payload = { bus_id: busId, date: dateStr, available };
    const { error } = await sb.from('bus_availability').upsert(payload, { onConflict: 'bus_id,date' });
    if (error) {
      setBusAvailabilityFallback(true);
      return error;
    }
    setBusAvailabilityFallback(false);
    return null;
  }

  async function loadAdminBusAvailability() {
    setAdminBusLoading(true);
    const data = await fetchBusAvailability(selectedAdminBus, adminBusViewMonth);
    setAdminBusLoading(false);
    setCachedAdminBusAvailability(data);
    setAdminBusNote(`Edytujesz: ${BUS_DETAILS[selectedAdminBus].name}. Kliknięcie dnia przełącza status dostępny/niedostępny.`);
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
    const form = new FormData(event.currentTarget);
    const bus = BUS_DETAILS[selectedBus].name;
    const phone = field(form, 'phone');
    const notes = field(form, 'notes');
    const validationError = selectedRentalDate ? validatePhone(phone) : 'Wybierz dostępny termin w kalendarzu.';
    if (validationError) {
      setRentalMsg({ type: 'err', text: validationError });
      return;
    }
    setRentalSubmitting(true);
    try {
      const stillAvailable = await fetchBusAvailabilityForDate(selectedBus, selectedRentalDate);
      if (!stillAvailable || selectedRentalDate < todayStr()) {
        setSelectedRentalDate(null);
        await loadRentalBusAvailability();
        setRentalMsg({ type: 'err', text: 'Ten termin jest już niedostępny. Wybierz inny dzień w kalendarzu.' });
        return;
      }
      const body = `Zapytanie o wynajem busa\n\nBus: ${bus}\nTermin: ${formatDate(selectedRentalDate)}\nTelefon: ${phone}\nOpis wyjazdu: ${notes || '-'}`;
      setRentalMsg({ type: 'ok', text: 'Zapytanie przygotowane. Otwieram wiadomość email z danymi.' });
      window.location.href = buildMailto(CONTACT_EMAIL, 'Zapytanie o wynajem busa', body);
    } catch (_error) {
      setRentalMsg({ type: 'err', text: 'Nie udało się potwierdzić dostępności terminu. Odśwież stronę i spróbuj ponownie.' });
    } finally {
      setRentalSubmitting(false);
    }
  }

  async function submitTowRequest(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = field(form, 'name');
    const phone = field(form, 'phone');
    const car = field(form, 'car');
    const state = field(form, 'state');
    const from = field(form, 'from');
    const to = field(form, 'to');
    const date = field(form, 'date');
    const direction = field(form, 'direction');
    const notes = field(form, 'notes');
    const validationError = validateRequired(name, 'Imię i nazwisko')
      || validatePhone(phone)
      || validateRequired(car, 'Marka i model')
      || validateRequired(from, 'Miejsce odbioru')
      || validateRequired(to, 'Miejsce dostawy')
      || validateRequired(date, 'Preferowana data');
    if (validationError) {
      setTowMsg({ type: 'err', text: validationError });
      return;
    }
    const body = `Zapytanie o transport lawetą\n\nImię i nazwisko: ${name}\nTelefon: ${phone}\nPojazd: ${car}\nStan: ${state}\nKierunek: ${direction}\nOdbiór: ${from}\nDostawa: ${to}\nPreferowana data: ${date}\nDodatkowe informacje: ${notes || '-'}`;
    setTowMsg({ type: 'ok', text: 'Zapytanie przygotowane. Otwieram wiadomość email z danymi.' });
    window.location.href = buildMailto(CONTACT_EMAIL, 'Zapytanie o transport lawetą', body);
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
    const validationError = validateRequired(name, 'Imię i nazwisko')
      || validateEmail(email)
      || validatePhone(phone)
      || validateSeats(seats)
      || (selectedBookingDate ? null : 'Wybierz termin przejazdu.');
    if (validationError) {
      setBookingMsg({ type: 'err', text: validationError });
      return;
    }
    if (!selectedTripId) {
      setBookingMsg({ type: 'err', text: 'Wybierz termin.' });
      return;
    }
    if (pickupStop === dropoffStop) {
      setBookingMsg({ type: 'err', text: 'Przystanek wsiadania i wysiadania nie może być taki sam.' });
      return;
    }
    const routeStops = routeDetails.stops.map((stop) => stop.name);
    if (routeStops.indexOf(pickupStop) > routeStops.indexOf(dropoffStop)) {
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
    const stopNotes = `Wsiadanie: ${pickupStop} | Wysiadanie: ${dropoffStop}${notes ? ` | Uwagi: ${notes}` : ''}`;
    const { data, error } = await sb.rpc('create_reservation_atomic', {
      p_trip_id: selectedTripId,
      p_passenger_name: name,
      p_passenger_email: email,
      p_passenger_phone: phone,
      p_seats: seats,
      p_notes: stopNotes,
      p_user_id: currentUser?.id || null
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
    setBookingMsg({ type: 'ok', text: `Rezerwacja potwierdzona. Nr: ${data?.id || 'nadany w systemie'}` });
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
    if (!window.confirm('Czy na pewno chcesz anulować tę rezerwację?')) return;
    setMyResMsg({ type: 'info', text: 'Anulowanie rezerwacji...' });
    const { error } = await sb.from('reservations').update({ status: 'cancelled' }).eq('id', resId);
    if (error) {
      setMyResMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setMyResMsg({ type: 'ok', text: 'Rezerwacja została anulowana.' });
    await loadMyReservations();
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
    } else {
      const id = `T${dateStr.replace(/-/g, '')}${selectedAdminRoute}`;
      const { error } = await sb.from('trips').insert({ id, route: selectedAdminRoute, date: dateStr, cancelled: false, max_seats: MAX_SEATS });
      if (error) {
        setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
        return;
      }
    }
    await loadAdminTrips();
  }

  async function toggleTrip(id, cancel) {
    if (cancel && !window.confirm('Odwołać ten kurs?')) return;
    const { error } = await sb.from('trips').update({ cancelled: cancel }).eq('id', id);
    if (error) setAdminGenMsg({ type: 'err', text: `Błąd: ${error.message}` });
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
    const { data, error } = await sb.from('reservations').select('*,trips(route,date)').order('created_at', { ascending: false });
    setAdminReservationsLoading(false);
    if (error) {
      setAdminReservations([]);
      setAdminGenMsg({ type: 'err', text: `Błąd ładowania rezerwacji: ${error.message}` });
      return;
    }
    setAdminReservations(data || []);
  }

  async function toggleAdminBusDate(dateStr) {
    const current = getCachedBusAvailability(cachedAdminBusAvailability, selectedAdminBus, dateStr);
    const error = await saveBusAvailability(selectedAdminBus, dateStr, !current);
    if (error) {
      setAdminBusNote(`Nie udało się zapisać dostępności w Supabase: ${error.message}`);
      return;
    }
    await loadAdminBusAvailability();
    if (selectedBus === selectedAdminBus && rentalViewMonth.getMonth() === adminBusViewMonth.getMonth() && rentalViewMonth.getFullYear() === adminBusViewMonth.getFullYear()) {
      await loadRentalBusAvailability(true);
    }
  }

  const navItems = [
    ['/', 'Start'],
    ['/rental', 'Wynajem busów'],
    ['/booking', 'Jarosław-Wiedeń'],
    ['/tow', 'Laweta'],
    ['/my-reservations', 'Moje rezerwacje'],
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
          {currentProfile?.role === 'admin' ? (
            <NavLink to="/admin" className={({ isActive }) => `tab-btn admin-link ${isActive ? 'active' : ''}`}>Panel</NavLink>
          ) : null}
        </div>
        <div className="nav-account">
          {currentUser ? (
            <details className="user-menu">
              <summary>{currentUser.email}</summary>
              <button onClick={signOut} type="button">Wyloguj</button>
            </details>
          ) : (
            <NavLink to="/auth" className="account-link">Logowanie</NavLink>
          )}
        </div>
      </nav>

      {profileError ? <div className="user-bar err">Nie udało się pobrać profilu: {profileError}</div> : null}

      <Routes>
        <Route path="/" element={<HomePage showPage={showPage} currentUser={currentUser} contactEmail={CONTACT_EMAIL} />} />
        <Route path="/rental" element={<RentalPage selectedBus={selectedBus} setSelectedBus={setSelectedBus} rentalViewMonth={rentalViewMonth} setRentalViewMonth={setRentalViewMonth} busAvailability={busAvailability} selectedRentalDate={selectedRentalDate} setSelectedRentalDate={setSelectedRentalDate} busAvailabilityFallback={busAvailabilityFallback} submitRentalRequest={submitRentalRequest} rentalMsg={rentalMsg} rentalSubmitting={rentalSubmitting} rentalLoading={rentalLoading} />} />
        <Route path="/auth" element={<AuthPage authForm={authForm} setAuthForm={setAuthForm} authMsg={authMsg} authLoading={authLoading} doLogin={doLogin} doRegister={doRegister} doReset={doReset} />} />
        <Route path="/booking" element={<BookingPage selectedRoute={selectedRoute} setSelectedRoute={setSelectedRoute} routeDetails={routeDetails} bookingViewMonth={bookingViewMonth} setBookingViewMonth={setBookingViewMonth} cachedTrips={cachedTrips} selectedTripId={selectedTripId} selectedBookingDate={selectedBookingDate} selectBookingDay={selectBookingDay} pickupStop={pickupStop} dropoffStop={dropoffStop} setPickupStop={setPickupStop} setDropoffStop={setDropoffStop} chooseStop={chooseStop} submitBooking={submitBooking} bookingMsg={bookingMsg} bookingSubmitting={bookingSubmitting} bookingLoading={bookingLoading} currentUser={currentUser} currentProfile={currentProfile} />} />
        <Route path="/tow" element={<TowPage towMsg={towMsg} submitTowRequest={submitTowRequest} />} />
        <Route path="/my-reservations" element={<MyReservationsPage currentUser={currentUser} showPage={showPage} myReservations={myReservations} myResMsg={myResMsg} myReservationsLoading={myReservationsLoading} cancelReservation={cancelReservation} />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/admin" element={<ProtectedAdminRoute authReady={authReady} currentProfile={currentProfile}><AdminPage adminTab={adminTab} setAdminTab={setAdminTab} adminViewMonth={adminViewMonth} setAdminViewMonth={setAdminViewMonth} selectedAdminRoute={selectedAdminRoute} setSelectedAdminRoute={setSelectedAdminRoute} cachedAdminTrips={cachedAdminTrips} toggleAdminTripDate={toggleAdminTripDate} generateMonth={generateMonth} adminGenMsg={adminGenMsg} toggleTrip={toggleTrip} adminTripsLoading={adminTripsLoading} adminReservations={adminReservations} adminReservationsLoading={adminReservationsLoading} adminBusViewMonth={adminBusViewMonth} setAdminBusViewMonth={setAdminBusViewMonth} selectedAdminBus={selectedAdminBus} setSelectedAdminBus={setSelectedAdminBus} cachedAdminBusAvailability={cachedAdminBusAvailability} toggleAdminBusDate={toggleAdminBusDate} adminBusNote={adminBusNote} adminBusLoading={adminBusLoading} /></ProtectedAdminRoute>} />
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
            <NavLink to="/contact">Zapytania i informacje</NavLink>
          </div>
        </div>
        <div className="footer-bottom">© 2026 Wynajem Busów Jarosław. Wszelkie prawa zastrzeżone.</div>
      </footer>
    </div>
  );
}
