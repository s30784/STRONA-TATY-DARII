import React from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import './styles.css';

const SB_URL = 'https://fzjvrjowptibysaythwa.supabase.co';
const SB_KEY = 'sb_publishable_IwEk9ePTdCzXivBHz8Gjcw_6iURm6p_';
const sb = createClient(SB_URL, SB_KEY);

const PUBLIC_APP_ORIGIN = 'https://strona-taty-darii.onrender.com';
const CURRENT_HOST = window.location.hostname;
const APP_ORIGIN = CURRENT_HOST === 'localhost' || CURRENT_HOST === '127.0.0.1'
  ? PUBLIC_APP_ORIGIN
  : window.location.origin;

const AUTH_REDIRECTS = {
  verifyEmail: `${APP_ORIGIN}/verify-email.html`,
  resetPassword: `${APP_ORIGIN}/reset-password.html`
};

const MAX_SEATS = 7;
const MONTHS = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec', 'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'];

const ROUTE_DETAILS = {
  JW: {
    title: 'Schemat trasy: Jarosław → Wiedeń',
    mapUrl: 'https://www.google.com/maps/dir/Jaros%C5%82aw/Rzesz%C3%B3w/Krak%C3%B3w/Wiede%C5%84',
    stops: [
      { name: 'Jarosław', desc: 'start kursu, dokładne miejsce do potwierdzenia telefonicznie' },
      { name: 'Przeworsk / Łańcut', desc: 'możliwy odbiór po wcześniejszym ustaleniu' },
      { name: 'Rzeszów', desc: 'dogodne miejsce dosiadki przy trasie' },
      { name: 'Kraków / okolice A4', desc: 'przystanek zależny od konkretnego przejazdu' },
      { name: 'Wiedeń', desc: 'wysiadka w uzgodnionym punkcie lub pod adresem' }
    ]
  },
  WJ: {
    title: 'Schemat trasy: Wiedeń → Jarosław',
    mapUrl: 'https://www.google.com/maps/dir/Wiede%C5%84/Krak%C3%B3w/Rzesz%C3%B3w/Jaros%C5%82aw',
    stops: [
      { name: 'Wiedeń', desc: 'start kursu, punkt odbioru ustalany przy rezerwacji' },
      { name: 'Okolice granicy AT/CZ lub AT/SK', desc: 'przystanki zależne od przejazdu' },
      { name: 'Kraków / okolice A4', desc: 'możliwa wysiadka po wcześniejszym ustaleniu' },
      { name: 'Rzeszów', desc: 'wygodny punkt wysiadki przy trasie' },
      { name: 'Jarosław', desc: 'koniec kursu lub dowóz po uzgodnieniu' }
    ]
  }
};

const BUS_DETAILS = {
  bus9: {
    name: 'Mercedes-Benz Vito',
    selectLabel: 'Mercedes-Benz Vito',
    image: 'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_Mercedes-Benz_Vito_119_CDI_Tourer_Pro.jpg',
    description: 'Nowoczesny bus do wyjazdów lokalnych, rodzinnych i pracowniczych. Dobry wybór na wesela, lotniska i jednodniowe trasy.',
    features: ['9 miejsc z kierowcą', 'klimatyzacja', 'przestrzeń na bagaż', 'wynajem z kierowcą lub według ustaleń']
  },
  bus8: {
    name: 'Volkswagen Caravelle',
    selectLabel: 'Volkswagen Caravelle',
    image: 'https://assets.volkswagen.com/is/image/volkswagenag/cv001184pic-vw-caravelle-gallery-01-2x1?Zml0PWNyb3AsMSZmbXQ9cG5nJndpZD04MDAmYWxpZ249MC4wMCwwLjAwJmJmYz1vZmYmYzRiMA=%3D',
    description: 'Komfortowy wariant na dłuższe przejazdy, transfery i wyjazdy firmowe, gdzie liczy się wygoda pasażerów oraz elastyczna przestrzeń.',
    features: ['8 miejsc pasażerskich', 'wygodne fotele', 'USB / ładowanie', 'polecany na dłuższe trasy']
  }
};

function todayStr() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function formatDate(date) {
  return new Date(`${date}T12:00:00`).toLocaleDateString('pl-PL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function monthRange(viewDate) {
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const monthStr = String(month + 1).padStart(2, '0');
  const days = new Date(year, month + 1, 0).getDate();
  return {
    year,
    month,
    from: `${year}-${monthStr}-01`,
    to: `${year}-${monthStr}-${String(days).padStart(2, '0')}`,
    days
  };
}

function dateOnly(value) {
  return value ? String(value).slice(0, 10) : '';
}

function tripDate(trip) {
  return dateOnly(trip?.date);
}

function tripMaxSeats(trip) {
  const seats = Number(trip?.max_seats);
  return Number.isFinite(seats) && seats > 0 ? seats : MAX_SEATS;
}

function tripUsedSeats(trip) {
  const seats = Number(trip?.used_seats);
  return Number.isFinite(seats) && seats > 0 ? seats : 0;
}

function tripFreeSeats(trip) {
  const free = Number(trip?.free_seats);
  if (Number.isFinite(free)) return Math.max(0, free);
  return Math.max(0, tripMaxSeats(trip) - tripUsedSeats(trip));
}

function normalizeTrips(trips) {
  return (trips || []).map((trip) => ({
    ...trip,
    date: tripDate(trip),
    max_seats: tripMaxSeats(trip),
    used_seats: tripUsedSeats(trip),
    free_seats: tripFreeSeats(trip)
  }));
}

function busIdFromLabel(label) {
  return Object.keys(BUS_DETAILS).find((id) => BUS_DETAILS[id].selectLabel === label) || 'bus9';
}

function defaultBusAvailable(dateStr) {
  return dateStr >= todayStr();
}

function lastStop(stops) {
  return stops[stops.length - 1];
}

function buildMailto(subject, body) {
  return `mailto:kontakt@wynajembusowjaroslaw.pl?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function Message({ message }) {
  if (!message?.text) return null;
  return <div className={`msg ${message.type || 'info'}`}>{message.text}</div>;
}

function Card({ title, children, className = '' }) {
  return (
    <div className={`card ${className}`}>
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

function App() {
  const [activePage, setActivePage] = React.useState('home');
  const [currentUser, setCurrentUser] = React.useState(null);
  const [currentProfile, setCurrentProfile] = React.useState(null);
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

  const [selectedRoute, setSelectedRoute] = React.useState('JW');
  const [bookingViewMonth, setBookingViewMonth] = React.useState(new Date());
  const [cachedTrips, setCachedTrips] = React.useState([]);
  const [selectedTripId, setSelectedTripId] = React.useState(null);
  const [selectedBookingDate, setSelectedBookingDate] = React.useState(null);
  const [pickupStop, setPickupStop] = React.useState(ROUTE_DETAILS.JW.stops[0].name);
  const [dropoffStop, setDropoffStop] = React.useState(lastStop(ROUTE_DETAILS.JW.stops).name);
  const [bookingMsg, setBookingMsg] = React.useState(null);
  const [bookingSubmitting, setBookingSubmitting] = React.useState(false);

  const [towMsg, setTowMsg] = React.useState(null);
  const [myReservations, setMyReservations] = React.useState([]);
  const [myResMsg, setMyResMsg] = React.useState(null);

  const [adminTab, setAdminTab] = React.useState('trips');
  const [adminViewMonth, setAdminViewMonth] = React.useState(new Date());
  const [selectedAdminRoute, setSelectedAdminRoute] = React.useState('JW');
  const [cachedAdminTrips, setCachedAdminTrips] = React.useState([]);
  const [adminGenMsg, setAdminGenMsg] = React.useState(null);
  const [adminReservations, setAdminReservations] = React.useState([]);
  const [adminBusViewMonth, setAdminBusViewMonth] = React.useState(new Date());
  const [selectedAdminBus, setSelectedAdminBus] = React.useState('bus9');
  const [cachedAdminBusAvailability, setCachedAdminBusAvailability] = React.useState([]);
  const [adminBusNote, setAdminBusNote] = React.useState('Kliknij dzień, aby przełączyć dostępność busa.');

  const routeDetails = ROUTE_DETAILS[selectedRoute];
  const selectedTrip = cachedTrips.find((trip) => trip.id === selectedTripId);

  React.useEffect(() => {
    let mounted = true;
    sb.auth.getSession().then(async ({ data }) => {
      if (mounted && data.session) await onLogin(data.session.user);
    });
    const { data: listener } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (session) await onLogin(session.user);
      else onLogout();
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  React.useEffect(() => {
    const stops = ROUTE_DETAILS[selectedRoute].stops;
    setPickupStop(stops[0].name);
    setDropoffStop(lastStop(stops).name);
    setSelectedTripId(null);
    setSelectedBookingDate(null);
    if (activePage === 'booking') loadTrips();
  }, [selectedRoute]);

  React.useEffect(() => {
    if (activePage === 'rental') loadRentalBusAvailability(true);
    if (activePage === 'booking') loadTrips();
    if (activePage === 'myres') loadMyReservations();
    if (activePage === 'admin') loadAdminTrips();
    if (activePage === 'admin' && adminTab === 'buses') loadAdminBusAvailability();
    if (activePage === 'admin' && adminTab === 'res') loadAdminReservations();
  }, [activePage]);

  React.useEffect(() => {
    if (activePage === 'rental') loadRentalBusAvailability(true);
  }, [selectedBus, rentalViewMonth]);

  React.useEffect(() => {
    if (activePage === 'booking') loadTrips();
  }, [bookingViewMonth]);

  React.useEffect(() => {
    if (activePage === 'admin') loadAdminTrips();
  }, [adminViewMonth, selectedAdminRoute]);

  React.useEffect(() => {
    if (activePage === 'admin' && adminTab === 'buses') loadAdminBusAvailability();
    if (activePage === 'admin' && adminTab === 'res') loadAdminReservations();
  }, [adminTab, adminBusViewMonth, selectedAdminBus]);

  React.useEffect(() => {
    const interval = window.setInterval(() => {
      const rentalPageVisible = activePage === 'rental';
      if (rentalPageVisible) loadRentalBusAvailability(true);
    }, 15000);
    const onVisibility = () => {
      if (!document.hidden && activePage === 'rental') loadRentalBusAvailability(true);
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [activePage, selectedBus, rentalViewMonth]);

  async function onLogin(user) {
    setCurrentUser(user);
    const { data } = await sb.from('profiles').select('*').eq('id', user.id).single();
    setCurrentProfile(data || null);
  }

  function onLogout() {
    setCurrentUser(null);
    setCurrentProfile(null);
  }

  function showPage(page) {
    setActivePage(page);
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
    const today = todayStr();
    const { data, error } = await fetchTripsWithSeats(today);
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
    const data = await fetchBusAvailability(selectedBus, rentalViewMonth);
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
    const data = await fetchBusAvailability(selectedAdminBus, adminBusViewMonth);
    setCachedAdminBusAvailability(data);
    setAdminBusNote(`Edytujesz: ${BUS_DETAILS[selectedAdminBus].name}. Kliknięcie dnia przełącza status dostępny/niedostępny.`);
  }

  async function doLogin(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setAuthLoading('login');
    const { error } = await sb.auth.signInWithPassword({
      email: form.get('email').trim(),
      password: form.get('password')
    });
    setAuthLoading('');
    if (error) {
      setAuthMsg({ type: 'err', text: `Błąd: ${error.message}` });
      return;
    }
    setAuthMsg(null);
    showPage('home');
  }

  async function doRegister(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const fname = form.get('fname').trim();
    const lname = form.get('lname').trim();
    const email = form.get('email').trim();
    const password = form.get('password');
    const phone = form.get('phone').trim();
    if (!fname || !lname || !email || !password) {
      setAuthMsg({ type: 'err', text: 'Wypełnij wymagane pola.' });
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
    const email = form.get('email').trim();
    if (!email) {
      setAuthMsg({ type: 'err', text: 'Wpisz email.' });
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
    showPage('home');
  }

  async function submitRentalRequest(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const bus = BUS_DETAILS[selectedBus].name;
    const phone = form.get('phone').trim();
    const notes = form.get('notes').trim();
    if (!selectedRentalDate || !phone) {
      setRentalMsg({ type: 'err', text: 'Wybierz dostępny termin w kalendarzu i wpisz numer telefonu.' });
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
      window.location.href = buildMailto('Zapytanie o wynajem busa', body);
    } catch (_error) {
      setRentalMsg({ type: 'err', text: 'Nie udało się potwierdzić dostępności terminu. Odśwież stronę i spróbuj ponownie.' });
    } finally {
      setRentalSubmitting(false);
    }
  }

  async function submitTowRequest(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const name = form.get('name').trim();
    const phone = form.get('phone').trim();
    const car = form.get('car').trim();
    const state = form.get('state');
    const from = form.get('from').trim();
    const to = form.get('to').trim();
    const date = form.get('date');
    const direction = form.get('direction');
    const notes = form.get('notes').trim();
    if (!name || !phone || !car || !from || !to) {
      setTowMsg({ type: 'err', text: 'Uzupełnij dane kontaktowe, pojazd oraz miejsca transportu.' });
      return;
    }
    const body = `Zapytanie o transport lawetą\n\nImię i nazwisko: ${name}\nTelefon: ${phone}\nPojazd: ${car}\nStan: ${state}\nKierunek: ${direction}\nOdbiór: ${from}\nDostawa: ${to}\nPreferowana data: ${date || '-'}\nDodatkowe informacje: ${notes || '-'}`;
    setTowMsg({ type: 'ok', text: 'Zapytanie przygotowane. Otwieram wiadomość email z danymi.' });
    window.location.href = buildMailto('Zapytanie o transport lawetą', body);
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
    const name = form.get('name').trim();
    const email = form.get('email').trim();
    const phone = form.get('phone').trim();
    const seats = parseInt(form.get('seats'), 10) || 1;
    const notes = form.get('notes').trim();
    if (!name || !email) {
      setBookingMsg({ type: 'err', text: 'Wpisz imię, nazwisko i email.' });
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
    const { data: freshTrips, error: freshError } = await fetchTripsWithSeats(selectedBookingDate, selectedBookingDate);
    const freshTrip = (freshTrips || []).find((trip) => trip.id === selectedTripId);
    if (freshError || !freshTrip || freshTrip.cancelled || tripFreeSeats(freshTrip) < seats) {
      setBookingSubmitting(false);
      await loadTrips();
      setBookingMsg({ type: 'err', text: 'Ten termin właśnie się zmienił albo nie ma już tylu miejsc. Odświeżyłem kalendarz.' });
      return;
    }
    const resId = `R${Date.now()}`;
    const stopNotes = `Wsiadanie: ${pickupStop} | Wysiadanie: ${dropoffStop}${notes ? ` | Uwagi: ${notes}` : ''}`;
    const payload = {
      id: resId,
      trip_id: selectedTripId,
      passenger_name: name,
      passenger_email: email,
      passenger_phone: phone || null,
      seats,
      notes: stopNotes,
      status: 'confirmed'
    };
    if (currentUser) payload.user_id = currentUser.id;
    const { error } = await sb.from('reservations').insert(payload);
    setBookingSubmitting(false);
    if (error) {
      setBookingMsg({ type: 'err', text: `Błąd rezerwacji: ${error.message}` });
      return;
    }
    setSelectedTripId(null);
    setSelectedBookingDate(null);
    event.currentTarget.reset();
    await loadTrips();
    setBookingMsg({ type: 'ok', text: `Rezerwacja potwierdzona. Nr: ${resId}` });
  }

  async function loadMyReservations() {
    if (!currentUser) {
      setMyReservations([]);
      return;
    }
    const { data, error } = await sb
      .from('reservations')
      .select('*,trips(route,date,cancelled)')
      .eq('user_id', currentUser.id)
      .order('created_at', { ascending: false });
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
    const range = monthRange(adminViewMonth);
    const { data, error } = await fetchTripsWithSeats(range.from, range.to);
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
    await sb.from('trips').update({ cancelled: cancel }).eq('id', id);
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
    const { data, error } = await sb.from('reservations').select('*,trips(route,date)').order('created_at', { ascending: false });
    if (error) {
      setAdminReservations([]);
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
    ['home', 'Start'],
    ['rental', 'Wynajem busów'],
    ['booking', 'Jarosław-Wiedeń'],
    ['tow', 'Laweta'],
    ['myres', 'Moje rezerwacje'],
    ['contact', 'Kontakt']
  ];

  return (
    <div className="site">
      <nav className="nav">
        <div className="nav-logo">Wynajem Busów<span>Jarosław</span></div>
        <div className="nav-tabs">
          {navItems.map(([id, label]) => (
            <button key={id} className={`tab-btn ${activePage === id ? 'active' : ''}`} onClick={() => showPage(id)}>{label}</button>
          ))}
          {currentProfile?.role === 'admin' ? (
            <button className={`tab-btn ${activePage === 'admin' ? 'active' : ''}`} onClick={() => showPage('admin')}>Panel</button>
          ) : null}
        </div>
      </nav>

      {currentUser ? (
        <div className="user-bar">
          <span>Zalogowany jako: <strong>{currentUser.email}</strong></span>
          <button className="small-btn" onClick={signOut}>Wyloguj</button>
        </div>
      ) : null}

      {activePage === 'home' ? <HomePage showPage={showPage} currentUser={currentUser} /> : null}
      {activePage === 'rental' ? (
        <RentalPage
          selectedBus={selectedBus}
          setSelectedBus={setSelectedBus}
          rentalViewMonth={rentalViewMonth}
          setRentalViewMonth={setRentalViewMonth}
          busAvailability={busAvailability}
          selectedRentalDate={selectedRentalDate}
          setSelectedRentalDate={setSelectedRentalDate}
          busAvailabilityFallback={busAvailabilityFallback}
          submitRentalRequest={submitRentalRequest}
          rentalMsg={rentalMsg}
          rentalSubmitting={rentalSubmitting}
        />
      ) : null}
      {activePage === 'auth' ? (
        <AuthPage
          authForm={authForm}
          setAuthForm={setAuthForm}
          authMsg={authMsg}
          authLoading={authLoading}
          doLogin={doLogin}
          doRegister={doRegister}
          doReset={doReset}
        />
      ) : null}
      {activePage === 'booking' ? (
        <BookingPage
          selectedRoute={selectedRoute}
          setSelectedRoute={setSelectedRoute}
          routeDetails={routeDetails}
          bookingViewMonth={bookingViewMonth}
          setBookingViewMonth={setBookingViewMonth}
          cachedTrips={cachedTrips}
          selectedTripId={selectedTripId}
          selectedBookingDate={selectedBookingDate}
          selectBookingDay={selectBookingDay}
          pickupStop={pickupStop}
          dropoffStop={dropoffStop}
          setPickupStop={setPickupStop}
          setDropoffStop={setDropoffStop}
          chooseStop={chooseStop}
          submitBooking={submitBooking}
          bookingMsg={bookingMsg}
          bookingSubmitting={bookingSubmitting}
          currentUser={currentUser}
          currentProfile={currentProfile}
        />
      ) : null}
      {activePage === 'tow' ? <TowPage towMsg={towMsg} submitTowRequest={submitTowRequest} /> : null}
      {activePage === 'myres' ? (
        <MyReservationsPage
          currentUser={currentUser}
          showPage={showPage}
          myReservations={myReservations}
          myResMsg={myResMsg}
          cancelReservation={cancelReservation}
        />
      ) : null}
      {activePage === 'contact' ? <ContactPage /> : null}
      {activePage === 'admin' && currentProfile?.role === 'admin' ? (
        <AdminPage
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          adminViewMonth={adminViewMonth}
          setAdminViewMonth={setAdminViewMonth}
          selectedAdminRoute={selectedAdminRoute}
          setSelectedAdminRoute={setSelectedAdminRoute}
          cachedAdminTrips={cachedAdminTrips}
          toggleAdminTripDate={toggleAdminTripDate}
          generateMonth={generateMonth}
          adminGenMsg={adminGenMsg}
          toggleTrip={toggleTrip}
          adminReservations={adminReservations}
          adminBusViewMonth={adminBusViewMonth}
          setAdminBusViewMonth={setAdminBusViewMonth}
          selectedAdminBus={selectedAdminBus}
          setSelectedAdminBus={setSelectedAdminBus}
          cachedAdminBusAvailability={cachedAdminBusAvailability}
          toggleAdminBusDate={toggleAdminBusDate}
          adminBusNote={adminBusNote}
        />
      ) : null}

      <div className="footer">© 2026 Wynajem Busów Jarosław · Wszelkie prawa zastrzeżone</div>
    </div>
  );
}

function HomePage({ showPage, currentUser }) {
  const services = [
    ['Wynajem busów', 'Busy dla rodzin, firm, ekip i grup wyjazdowych w okolicach Jarosławia, Przeworska i Rzeszowa.', 'Przejdź do wynajmu', 'rental'],
    ['Przejazdy Jarosław-Wiedeń', 'Regularne kursy z rezerwacją miejsc online i podglądem dostępnych terminów w kalendarzu.', 'Zarezerwuj miejsce', 'booking'],
    ['Transport lawetą', 'Przewóz samochodów i motocykli na trasie Polska-Austria, także przy okazji regularnych wyjazdów.', 'Zamów wycenę', 'tow']
  ];
  return (
    <div className="page active">
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1>Transport dla ludzi, grup i pojazdów na trasie Polska-Austria</h1>
          <p>Wynajem busów w okolicach Rzeszowa i Jarosławia, regularne przejazdy Jarosław-Wiedeń oraz transport lawetą na tej samej trasie.</p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => showPage('booking')}>Zarezerwuj przejazd</button>
            <button className="hero-btn secondary" onClick={() => showPage('rental')}>Sprawdź busy</button>
            {!currentUser ? <button className="hero-btn secondary" onClick={() => showPage('auth')}>Zaloguj się</button> : null}
          </div>
        </div>
      </section>
      <section className="section">
        <div className="service-grid">
          {services.map(([title, text, action, page]) => (
            <article className="service-card" key={title}>
              <div className="service-body">
                <h3>{title}</h3>
                <p>{text}</p>
                <button className="service-link" onClick={() => showPage(page)}>{action}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function Hero({ title, text }) {
  return (
    <div className="hero">
      <h1>{title}</h1>
      <p>{text}</p>
    </div>
  );
}

function RentalPage(props) {
  const {
    selectedBus,
    setSelectedBus,
    rentalViewMonth,
    setRentalViewMonth,
    busAvailability,
    selectedRentalDate,
    setSelectedRentalDate,
    busAvailabilityFallback,
    submitRentalRequest,
    rentalMsg,
    rentalSubmitting
  } = props;
  const bus = BUS_DETAILS[selectedBus];
  return (
    <div className="page active">
      <Hero title="Wynajem busów w okolicach Rzeszowa" text="Wybierz pojazd, sprawdź orientacyjny cennik i wyślij zapytanie o dostępność konkretnego terminu." />
      <section className="section">
        <div className="split-layout">
          <div>
            <div className="fleet-grid">
              {Object.entries(BUS_DETAILS).map(([id, item]) => (
                <article className={`fleet-card ${selectedBus === id ? 'selected' : ''}`} key={id}>
                  <img src={item.image} alt={item.name} />
                  <div className="fleet-card-body">
                    <h3>{item.name}</h3>
                    <p className="muted">{item.description}</p>
                    <div className="fleet-meta">{item.features.slice(0, 3).map((feature) => <span className="pill" key={feature}>{feature}</span>)}</div>
                    <button className="btn-outline" onClick={() => setSelectedBus(id)}>Pokaż szczegóły</button>
                  </div>
                </article>
              ))}
            </div>
            <Card title="Cennik orientacyjny" className="mt">
              <table className="price-table">
                <thead><tr><th>Usługa</th><th>Cena od</th></tr></thead>
                <tbody>
                  <tr><td>Wynajem do 24h</td><td>350 zł</td></tr>
                  <tr><td>Weekend</td><td>850 zł</td></tr>
                  <tr><td>Dłuższa trasa z kierowcą</td><td>wycena indywidualna</td></tr>
                  <tr><td>Transfer lotniskowy</td><td>wycena po trasie</td></tr>
                </tbody>
              </table>
            </Card>
          </div>
          <aside>
            <Card title={bus.name}>
              <p className="muted">{bus.description}</p>
              <ul className="mini-list">{bus.features.map((feature) => <li key={feature}>{feature}</li>)}</ul>
            </Card>
            <Card title="Kalendarz dostępności">
              <RentalCalendar
                viewDate={rentalViewMonth}
                setViewDate={setRentalViewMonth}
                availability={busAvailability}
                selectedBus={selectedBus}
                selectedDate={selectedRentalDate}
                setSelectedDate={setSelectedRentalDate}
                busAvailabilityFallback={busAvailabilityFallback}
              />
            </Card>
            <Card title="Zapytanie o wynajem">
              <Message message={rentalMsg} />
              <form onSubmit={submitRentalRequest}>
                <div className="fg"><label>Wybrany bus</label><select value={BUS_DETAILS[selectedBus].selectLabel} onChange={(e) => setSelectedBus(busIdFromLabel(e.target.value))}>{Object.values(BUS_DETAILS).map((item) => <option key={item.name}>{item.selectLabel}</option>)}</select></div>
                <div className="fg"><label>Wybrany termin</label><input type="text" value={selectedRentalDate ? formatDate(selectedRentalDate) : ''} placeholder="Wybierz dostępny dzień w kalendarzu" readOnly /></div>
                <div className="fg"><label>Telefon</label><input type="tel" name="phone" placeholder="+48 000 000 000" /></div>
                <div className="fg"><label>Opis wyjazdu</label><textarea name="notes" rows="3" placeholder="np. wesele, lotnisko, wyjazd firmowy"></textarea></div>
                <button className="btn-primary" type="submit" disabled={rentalSubmitting}>{rentalSubmitting ? 'Sprawdzam termin...' : 'Wyślij zapytanie'}</button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}

function RentalCalendar({ viewDate, setViewDate, availability, selectedBus, selectedDate, setSelectedDate, busAvailabilityFallback }) {
  const range = monthRange(viewDate);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isAvailable = availability.find((item) => item.bus_id === selectedBus && item.date === dateStr)?.available !== false && dateStr >= todayStr();
    const isPast = dateStr < todayStr();
    const selected = selectedDate === dateStr;
    const classes = `calendar-day ${isPast ? 'disabled' : isAvailable ? 'available' : 'disabled'} ${selected ? 'confirmed' : ''}`;
    cells.push(
      <button key={dateStr} className={classes} onClick={() => !isPast && isAvailable && setSelectedDate(dateStr)} type="button">
        <header><span className="day-number">{day}</span></header>
        <div className="day-meta">{isPast ? 'Minął' : isAvailable ? 'Dostępny' : 'Niedostępny'}</div>
      </button>
    );
  }
  return (
    <>
      <div className="calendar-controls">
        <div className="month-title">{MONTHS[range.month]} {range.year}</div>
        <div>
          <button className="month-btn" onClick={() => setViewDate(new Date(range.year, range.month - 1, 1))} type="button">‹</button>
          <button className="month-btn" onClick={() => setViewDate(new Date(range.year, range.month + 1, 1))} type="button">›</button>
        </div>
      </div>
      <Weekdays />
      <div className="calendar-grid">{cells}</div>
      <div className="no-trips mt-sm">{busAvailabilityFallback ? 'Nie udało się pobrać dostępności z systemu. Spróbuj odświeżyć stronę.' : selectedDate ? `Wybrano: ${formatDate(selectedDate)}` : 'Kliknij dostępny dzień, aby wybrać termin.'}</div>
    </>
  );
}

function Weekdays() {
  return (
    <div className="calendar-weekdays">
      {['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'].map((day) => <div className="weekday" key={day}>{day}</div>)}
    </div>
  );
}

function AuthPage({ authForm, setAuthForm, authMsg, authLoading, doLogin, doRegister, doReset }) {
  return (
    <div className="page active">
      <section className="auth-shell">
        <Message message={authMsg} />
        {authForm === 'login' ? (
          <Card title="Zaloguj się">
            <form onSubmit={doLogin}>
              <div className="fg"><label>Email</label><input type="email" name="email" placeholder="jan@example.com" /></div>
              <div className="fg"><label>Hasło</label><input type="password" name="password" placeholder="••••••••" /></div>
              <button className="btn-primary" disabled={authLoading === 'login'}>{authLoading === 'login' ? 'Loguję...' : 'Zaloguj się'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('register')}>Nie masz konta? Zarejestruj się</button>
            <button className="btn-outline mt-sm" onClick={() => setAuthForm('reset')}>Zapomniałem hasła</button>
          </Card>
        ) : null}
        {authForm === 'register' ? (
          <Card title="Rejestracja">
            <form onSubmit={doRegister}>
              <div className="fg2"><div className="fg"><label>Imię</label><input name="fname" /></div><div className="fg"><label>Nazwisko</label><input name="lname" /></div></div>
              <div className="fg"><label>Email</label><input type="email" name="email" /></div>
              <div className="fg"><label>Hasło</label><input type="password" name="password" /></div>
              <div className="fg"><label>Telefon</label><input type="tel" name="phone" /></div>
              <button className="btn-primary" disabled={authLoading === 'register'}>{authLoading === 'register' ? 'Rejestruję...' : 'Zarejestruj się'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('login')}>Mam już konto</button>
          </Card>
        ) : null}
        {authForm === 'reset' ? (
          <Card title="Reset hasła">
            <form onSubmit={doReset}>
              <div className="fg"><label>Email</label><input type="email" name="email" /></div>
              <button className="btn-primary" disabled={authLoading === 'reset'}>{authLoading === 'reset' ? 'Wysyłam...' : 'Wyślij link resetujący'}</button>
            </form>
            <hr className="divider" />
            <button className="btn-outline" onClick={() => setAuthForm('login')}>Wróć do logowania</button>
          </Card>
        ) : null}
      </section>
    </div>
  );
}

function BookingPage(props) {
  const {
    selectedRoute, setSelectedRoute, routeDetails, bookingViewMonth, setBookingViewMonth, cachedTrips, selectedTripId, selectedBookingDate,
    selectBookingDay, pickupStop, dropoffStop, setPickupStop, setDropoffStop, chooseStop, submitBooking, bookingMsg, bookingSubmitting, currentUser, currentProfile
  } = props;
  const range = monthRange(bookingViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  let availableCount = 0;
  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const trip = cachedTrips.find((item) => item.route === selectedRoute && tripDate(item) === dateStr);
    let meta = 'Brak kursu';
    let classes = 'calendar-day disabled';
    let disabled = true;
    if (trip) {
      if (trip.cancelled) {
        meta = 'Odwołany';
        classes = 'calendar-day cancelled';
      } else if (tripFreeSeats(trip) <= 0) {
        meta = 'Brak miejsc';
      } else {
        availableCount += 1;
        meta = `Miejsc: ${tripFreeSeats(trip)}`;
        classes = `calendar-day available ${selectedTripId === trip.id ? 'confirmed' : ''}`;
        disabled = false;
      }
    }
    cells.push(<button key={dateStr} className={classes} disabled={disabled} onClick={() => selectBookingDay(dateStr)} type="button"><header><span className="day-number">{day}</span></header><div className="day-meta">{meta}</div></button>);
  }
  const meta = currentUser?.user_metadata || {};
  return (
    <div className="page active">
      <Hero title="Przejazdy Jarosław-Wiedeń" text="Sprawdź trasę, przystanki i dostępne terminy. Rezerwacja zamyka się automatycznie, gdy nie ma już wolnych miejsc." />
      <section className="section">
        <Message message={bookingMsg} />
        <div className="route-switch">
          <button className={selectedRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedRoute('JW')}>Jarosław → Wiedeń</button>
          <button className={selectedRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedRoute('WJ')}>Wiedeń → Jarosław</button>
        </div>
        <div className="split-layout mb">
          <Card title={routeDetails.title}>
            <RouteDiagram routeDetails={routeDetails} chooseStop={chooseStop} />
          </Card>
          <Card title="Przystanki na trasie">
            <div className="stops-grid">
              {routeDetails.stops.map((stop, index) => (
                <button className="stop-item" key={stop.name} type="button" onClick={() => chooseStop(index, 'pickup')}><strong>{index + 1}. {stop.name}</strong><span>{stop.desc}</span></button>
              ))}
            </div>
          </Card>
        </div>
        <p className="step-label">1. Wybierz termin przejazdu</p>
        <div className="calendar-controls"><div className="month-title">{MONTHS[range.month]} {range.year}</div><div><button className="month-btn" onClick={() => setBookingViewMonth(new Date(range.year, range.month - 1, 1))}>‹</button><button className="month-btn" onClick={() => setBookingViewMonth(new Date(range.year, range.month + 1, 1))}>›</button></div></div>
        <Weekdays />
        <div className="calendar-grid">{cells}</div>
        <div className="no-trips mt-sm">{availableCount ? 'Kliknij dostępny dzień, aby wybrać termin.' : 'Brak dostępnych terminów w tym miesiącu dla wybranej trasy.'}</div>
        {selectedBookingDate ? (
          <form className="booking-form" onSubmit={submitBooking}>
            <p className="step-label">2. Dane pasażera</p>
            <Card>
              <div className="fg2"><div className="fg"><label>Imię i nazwisko</label><input name="name" defaultValue={meta.full_name || ''} /></div><div className="fg"><label>Email</label><input type="email" name="email" defaultValue={currentUser?.email || ''} /></div></div>
              <div className="fg2"><div className="fg"><label>Telefon</label><input type="tel" name="phone" defaultValue={currentProfile?.phone || ''} /></div><div className="fg"><label>Liczba miejsc</label><input type="number" name="seats" min="1" max="7" defaultValue="1" /></div></div>
              <div className="fg2"><div className="fg"><label>Przystanek wsiadania</label><select value={pickupStop} onChange={(e) => setPickupStop(e.target.value)}>{routeDetails.stops.map((stop, index) => <option key={stop.name} value={stop.name}>{index + 1}. {stop.name}</option>)}</select></div><div className="fg"><label>Przystanek wysiadania</label><select value={dropoffStop} onChange={(e) => setDropoffStop(e.target.value)}>{routeDetails.stops.map((stop, index) => <option key={stop.name} value={stop.name}>{index + 1}. {stop.name}</option>)}</select></div></div>
              <div className="fg"><label>Uwagi</label><input name="notes" placeholder="np. bagaż ponadgabarytowy" /></div>
              <button className="btn-primary" disabled={bookingSubmitting}>{bookingSubmitting ? 'Rezerwuję...' : 'Zarezerwuj miejsce'}</button>
            </Card>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function RouteDiagram({ routeDetails, chooseStop }) {
  return (
    <div className="route-diagram">
      <div className="route-line"></div>
      {routeDetails.stops.map((stop, index) => (
        <div className="route-stop-wrap" key={stop.name}>
          <button className={`route-stop ${index === 0 ? 'start' : index === routeDetails.stops.length - 1 ? 'end' : ''}`} type="button" onClick={() => chooseStop(index, 'pickup')}>
            <span className="route-dot">{index + 1}</span>
            <span><strong>{stop.name}</strong><span>{stop.desc}</span></span>
          </button>
          <div className="route-actions"><button type="button" onClick={() => chooseStop(index, 'pickup')}>Wsiadam tutaj</button><button type="button" onClick={() => chooseStop(index, 'dropoff')}>Wysiadam tutaj</button></div>
        </div>
      ))}
      <a className="map-link" href={routeDetails.mapUrl} target="_blank" rel="noreferrer">Otwórz trasę w Google Maps</a>
    </div>
  );
}

function TowPage({ towMsg, submitTowRequest }) {
  return (
    <div className="page active">
      <Hero title="Transport lawetą Polska-Austria" text="Przewóz samochodów, motocykli i pojazdów niesprawnych na trasie Jarosław-Wiedeń oraz w miejscowościach po drodze." />
      <section className="section">
        <div className="split-layout">
          <div>
            <Card title="Trasa lawety"><iframe className="map-frame" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Jaros%C5%82aw%20Poland%20to%20Vienna%20Austria&output=embed"></iframe></Card>
            <Card title="Co można zamówić"><ul className="mini-list"><li>przewóz auta z Polski do Austrii albo z Austrii do Polski</li><li>transport pojazdu niesprawnego po awarii lub kolizji</li><li>odbiór pojazdu z adresu, parkingu, warsztatu albo komisu</li><li>dostarczenie pod wskazany adres na trasie przejazdu</li></ul></Card>
          </div>
          <aside>
            <Card title="Szybka wycena lawety">
              <p className="form-help">Podaj dane pojazdu i miejsca odbioru. Formularz przygotuje zapytanie, które możesz od razu wysłać do firmy.</p>
              <Message message={towMsg} />
              <form onSubmit={submitTowRequest}>
                <div className="tow-form-grid"><div className="fg"><label>Imię i nazwisko</label><input name="name" /></div><div className="fg"><label>Telefon</label><input name="phone" /></div><div className="fg"><label>Marka i model</label><input name="car" /></div><div className="fg"><label>Stan pojazdu</label><select name="state"><option>Sprawny</option><option>Niesprawny, odpala</option><option>Niesprawny, nie odpala</option><option>Powypadkowy</option></select></div></div>
                <div className="fg"><label>Miejsce odbioru</label><input name="from" /></div>
                <div className="fg"><label>Miejsce dostawy</label><input name="to" /></div>
                <div className="fg2"><div className="fg"><label>Preferowana data</label><input type="date" name="date" /></div><div className="fg"><label>Kierunek</label><select name="direction"><option>Polska → Austria</option><option>Austria → Polska</option></select></div></div>
                <div className="fg"><label>Dodatkowe informacje</label><textarea name="notes" rows="3"></textarea></div>
                <button className="btn-primary">Przygotuj zapytanie</button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}

function MyReservationsPage({ currentUser, showPage, myReservations, myResMsg, cancelReservation }) {
  const total = myReservations.length;
  const upcoming = myReservations.filter((res) => res.trips?.date && new Date(res.trips.date) >= new Date()).length;
  const cancelled = myReservations.filter((res) => res.status === 'cancelled' || res.trips?.cancelled).length;
  return (
    <div className="page active">
      <Hero title="Moje rezerwacje" text="Historia Twoich przejazdów." />
      <section className="section">
        <Message message={myResMsg} />
        {!currentUser ? <div className="no-trips">Zaloguj się, aby zobaczyć rezerwacje. <button className="btn-outline mt-sm" onClick={() => showPage('auth')}>Zaloguj się</button></div> : null}
        {currentUser && !myReservations.length ? <div className="no-trips">Brak rezerwacji.</div> : null}
        {currentUser && myReservations.length ? (
          <>
            <Card><div className="summary-grid"><Summary label="Łącznie rezerwacji" value={total} /><Summary label="Nadchodzące" value={upcoming} /><Summary label="Odwołane" value={cancelled} /></div></Card>
            {myReservations.map((res) => {
              const route = res.trips?.route;
              const isCancelled = res.status === 'cancelled' || res.trips?.cancelled;
              return <div className="res-card" key={res.id}><div className="res-head"><div><strong>{res.trips?.date ? formatDate(res.trips.date) : '-'}</strong><span>{route === 'JW' ? 'Jarosław → Wiedeń' : 'Wiedeń → Jarosław'}</span></div><span className={`badge ${isCancelled ? 'badge-cancel' : 'badge-ok'}`}>{isCancelled ? 'Anulowana' : 'Potwierdzona'}</span></div><p className="muted">Miejsc: {res.seats}{res.notes ? ` · ${res.notes}` : ''}</p>{!isCancelled ? <button className="cancel-btn" onClick={() => cancelReservation(res.id)}>Anuluj rezerwację</button> : null}</div>;
            })}
          </>
        ) : null}
      </section>
    </div>
  );
}

function Summary({ label, value }) {
  return <div className="summary-item"><span>{label}</span><strong>{value}</strong></div>;
}

function ContactPage() {
  return (
    <div className="page active">
      <div className="hero"><h1>Kontakt i zapytania</h1><p>Wybierz usługę na stronie i wyślij zapytanie z kompletem danych do wyceny.</p></div>
      <section className="section contact-grid">
        <Card><div className="eyebrow">Wynajem busa</div><strong>Wybierz pojazd i termin w kalendarzu dostępności.</strong></Card>
        <Card><div className="eyebrow">Przejazdy</div><strong>Zarezerwuj miejsce na trasie Jarosław-Wiedeń.</strong></Card>
        <Card><div className="eyebrow">Laweta</div><strong>Przygotuj zapytanie o transport pojazdu.</strong></Card>
      </section>
    </div>
  );
}

function AdminPage(props) {
  const {
    adminTab, setAdminTab, adminViewMonth, setAdminViewMonth, selectedAdminRoute, setSelectedAdminRoute, cachedAdminTrips,
    toggleAdminTripDate, generateMonth, adminGenMsg, toggleTrip, adminReservations, adminBusViewMonth, setAdminBusViewMonth,
    selectedAdminBus, setSelectedAdminBus, cachedAdminBusAvailability, toggleAdminBusDate, adminBusNote
  } = props;
  return (
    <div className="page active">
      <section className="section">
        <div className="panel-head"><h2>Panel właściciela</h2></div>
        <div className="atabs"><button className={`atab ${adminTab === 'trips' ? 'active' : ''}`} onClick={() => setAdminTab('trips')}>Terminy kursów</button><button className={`atab ${adminTab === 'buses' ? 'active' : ''}`} onClick={() => setAdminTab('buses')}>Dostępność busów</button><button className={`atab ${adminTab === 'res' ? 'active' : ''}`} onClick={() => setAdminTab('res')}>Rezerwacje</button></div>
        {adminTab === 'trips' ? <AdminTrips adminViewMonth={adminViewMonth} setAdminViewMonth={setAdminViewMonth} selectedAdminRoute={selectedAdminRoute} setSelectedAdminRoute={setSelectedAdminRoute} cachedAdminTrips={cachedAdminTrips} toggleAdminTripDate={toggleAdminTripDate} generateMonth={generateMonth} adminGenMsg={adminGenMsg} toggleTrip={toggleTrip} /> : null}
        {adminTab === 'buses' ? <AdminBuses adminBusViewMonth={adminBusViewMonth} setAdminBusViewMonth={setAdminBusViewMonth} selectedAdminBus={selectedAdminBus} setSelectedAdminBus={setSelectedAdminBus} cachedAdminBusAvailability={cachedAdminBusAvailability} toggleAdminBusDate={toggleAdminBusDate} adminBusNote={adminBusNote} /> : null}
        {adminTab === 'res' ? <AdminReservations adminReservations={adminReservations} /> : null}
      </section>
    </div>
  );
}

function AdminTrips({ adminViewMonth, setAdminViewMonth, selectedAdminRoute, setSelectedAdminRoute, cachedAdminTrips, toggleAdminTripDate, generateMonth, adminGenMsg, toggleTrip }) {
  const range = monthRange(adminViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const trip = cachedAdminTrips.find((item) => item.route === selectedAdminRoute && tripDate(item) === dateStr);
    const label = trip ? trip.cancelled ? 'Anulowany' : 'Aktywny' : 'Dodaj';
    cells.push(<button key={dateStr} className={`calendar-day ${trip?.cancelled ? 'cancelled' : trip ? 'confirmed' : ''}`} onClick={() => toggleAdminTripDate(dateStr)}><header><span className="day-number">{day}</span></header><div className="day-meta">{label}</div></button>);
  }
  return (
    <>
      <div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month - 1, 1))}>‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month + 1, 1))}>›</button></div>
      <div className="admin-calendar-section"><div className="route-switch"><button className={selectedAdminRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedAdminRoute('JW')}>JW</button><button className={selectedAdminRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedAdminRoute('WJ')}>WJ</button></div><Weekdays /><div className="calendar-grid">{cells}</div><div className="no-trips mt-sm">Kliknij datę, aby dodać, odwołać lub przywrócić kurs.</div></div>
      <button className="btn-primary" onClick={generateMonth}>Wystaw terminy na ten miesiąc</button>
      <Message message={adminGenMsg} />
      <AdminTripList route="JW" trips={cachedAdminTrips} toggleTrip={toggleTrip} />
      <AdminTripList route="WJ" trips={cachedAdminTrips} toggleTrip={toggleTrip} />
    </>
  );
}

function AdminTripList({ route, trips, toggleTrip }) {
  const filtered = trips.filter((trip) => trip.route === route).sort((a, b) => new Date(tripDate(a)) - new Date(tripDate(b)));
  return (
    <div className="admin-list-block">
      <p className="admin-route-title">{route === 'JW' ? 'Jarosław → Wiedeń (niedziele)' : 'Wiedeń → Jarosław (piątki)'}</p>
      {!filtered.length ? <p className="muted">Brak terminów w tym miesiącu.</p> : null}
      {filtered.map((trip) => <div className={`admin-trip ${trip.cancelled ? 'cancelled' : ''}`} key={trip.id}><div className="at-info"><div className="at-date">{formatDate(trip.date)}{trip.cancelled ? ' - ODWOŁANY' : ''}</div><div className="at-sub">{tripUsedSeats(trip)}/{tripMaxSeats(trip)} miejsc zajętych</div></div>{trip.cancelled ? <button className="restore-btn" onClick={() => toggleTrip(trip.id, false)}>Przywróć</button> : <button className="cancel-btn" onClick={() => toggleTrip(trip.id, true)}>Odwołaj</button>}</div>)}
    </div>
  );
}

function AdminBuses({ adminBusViewMonth, setAdminBusViewMonth, selectedAdminBus, setSelectedAdminBus, cachedAdminBusAvailability, toggleAdminBusDate, adminBusNote }) {
  const range = monthRange(adminBusViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = cachedAdminBusAvailability.find((item) => item.bus_id === selectedAdminBus && item.date === dateStr);
    const isAvailable = row ? row.available !== false : defaultBusAvailable(dateStr);
    cells.push(<button key={dateStr} className={`calendar-day ${isAvailable ? 'available' : 'unavailable'}`} onClick={() => toggleAdminBusDate(dateStr)}><header><span className="day-number">{day}</span></header><div className="day-meta">{isAvailable ? 'Dostępny' : 'Niedostępny'}</div></button>);
  }
  return (
    <div className="admin-calendar-section"><div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminBusViewMonth(new Date(range.year, range.month - 1, 1))}>‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminBusViewMonth(new Date(range.year, range.month + 1, 1))}>›</button></div><div className="route-switch"><button className={selectedAdminBus === 'bus9' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus9')}>Mercedes-Benz Vito</button><button className={selectedAdminBus === 'bus8' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus8')}>Volkswagen Caravelle</button></div><Weekdays /><div className="calendar-grid">{cells}</div><div className="no-trips mt-sm">{adminBusNote}</div></div>
  );
}

function AdminReservations({ adminReservations }) {
  if (!adminReservations.length) return <div className="no-trips">Brak rezerwacji.</div>;
  return adminReservations.map((res) => <div className="res-card" key={res.id}><div className="res-head"><div><strong>{res.passenger_name}</strong><span>{res.passenger_email}{res.passenger_phone ? ` · ${res.passenger_phone}` : ''}</span></div><span className={`badge ${res.status === 'confirmed' ? 'badge-ok' : 'badge-cancel'}`}>{res.seats} miejsce(a)</span></div><p className="muted">{res.trips?.route === 'JW' ? 'Jarosław → Wiedeń' : 'Wiedeń → Jarosław'} · {res.trips?.date ? formatDate(res.trips.date) : '-'}</p>{res.notes ? <p className="muted">Uwagi: {res.notes}</p> : null}</div>);
}

createRoot(document.getElementById('root')).render(<App />);
