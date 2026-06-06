import { Message } from '../components/Message.jsx';
import { CalendarLegend } from '../components/CalendarLegend.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { BUS_DETAILS } from '../data/vehicles.js';
import { formatDate, monthRange } from '../lib/date.js';
import { defaultBusAvailable, tripDate, tripMaxSeats, tripUsedSeats } from '../lib/trips.js';

export function AdminPage(props) {
  const {
    adminTab,
    setAdminTab,
    adminViewMonth,
    setAdminViewMonth,
    selectedAdminRoute,
    setSelectedAdminRoute,
    cachedAdminTrips,
    toggleAdminTripDate,
    generateMonth,
    adminGenMsg,
    toggleTrip,
    adminTripsLoading,
    adminReservations,
    adminReservationsLoading,
    adminBusViewMonth,
    setAdminBusViewMonth,
    selectedAdminBus,
    setSelectedAdminBus,
    cachedAdminBusAvailability,
    toggleAdminBusDate,
    adminBusNote,
    adminBusLoading
  } = props;

  return (
    <div className="page active">
      <section className="section">
        <div className="panel-head"><h2>Panel właściciela</h2></div>
        <div className="atabs">
          <button className={`atab ${adminTab === 'trips' ? 'active' : ''}`} onClick={() => setAdminTab('trips')} type="button">Terminy kursów</button>
          <button className={`atab ${adminTab === 'buses' ? 'active' : ''}`} onClick={() => setAdminTab('buses')} type="button">Dostępność busów</button>
          <button className={`atab ${adminTab === 'res' ? 'active' : ''}`} onClick={() => setAdminTab('res')} type="button">Rezerwacje</button>
        </div>
        {adminTab === 'trips' ? <AdminTrips adminViewMonth={adminViewMonth} setAdminViewMonth={setAdminViewMonth} selectedAdminRoute={selectedAdminRoute} setSelectedAdminRoute={setSelectedAdminRoute} cachedAdminTrips={cachedAdminTrips} toggleAdminTripDate={toggleAdminTripDate} generateMonth={generateMonth} adminGenMsg={adminGenMsg} toggleTrip={toggleTrip} adminTripsLoading={adminTripsLoading} /> : null}
        {adminTab === 'buses' ? <AdminBuses adminBusViewMonth={adminBusViewMonth} setAdminBusViewMonth={setAdminBusViewMonth} selectedAdminBus={selectedAdminBus} setSelectedAdminBus={setSelectedAdminBus} cachedAdminBusAvailability={cachedAdminBusAvailability} toggleAdminBusDate={toggleAdminBusDate} adminBusNote={adminBusNote} adminBusLoading={adminBusLoading} /> : null}
        {adminTab === 'res' ? <AdminReservations adminReservations={adminReservations} adminReservationsLoading={adminReservationsLoading} /> : null}
      </section>
    </div>
  );
}

function AdminTrips({ adminViewMonth, setAdminViewMonth, selectedAdminRoute, setSelectedAdminRoute, cachedAdminTrips, toggleAdminTripDate, generateMonth, adminGenMsg, toggleTrip, adminTripsLoading }) {
  const range = monthRange(adminViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const trip = cachedAdminTrips.find((item) => item.route === selectedAdminRoute && tripDate(item) === dateStr);
    const label = trip ? trip.cancelled ? 'Anulowany' : 'Aktywny' : 'Dodaj';
    cells.push(<button key={dateStr} className={`calendar-day ${trip?.cancelled ? 'cancelled' : trip ? 'confirmed' : ''}`} onClick={() => toggleAdminTripDate(dateStr)} type="button" title={label} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${label}`}><header><span className="day-number">{day}</span></header></button>);
  }

  return (
    <>
      <div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month - 1, 1))} type="button">‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month + 1, 1))} type="button">›</button></div>
      <div className="admin-calendar-section">
        <div className="route-switch"><button className={selectedAdminRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedAdminRoute('JW')} type="button">JW</button><button className={selectedAdminRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedAdminRoute('WJ')} type="button">WJ</button></div>
        {adminTripsLoading ? <div className="loading-box">Ładuję terminy kursów...</div> : null}
        <Weekdays />
        <div className="calendar-grid">{cells}</div>
        <CalendarLegend items={[{ type: 'available', label: 'Aktywny' }, { type: 'blocked', label: 'Anulowany' }, { type: 'empty', label: 'Brak kursu' }]} />
        <div className="no-trips mt-sm">Kliknij datę, aby dodać, odwołać lub przywrócić kurs.</div>
      </div>
      <button className="btn-primary" onClick={generateMonth} type="button">Wystaw terminy na ten miesiąc</button>
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
      <p className="admin-route-title">{route === 'JW' ? 'Jarosław -> Wiedeń (niedziele)' : 'Wiedeń -> Jarosław (piątki)'}</p>
      {!filtered.length ? <p className="muted">Brak terminów w tym miesiącu.</p> : null}
      {filtered.map((trip) => <div className={`admin-trip ${trip.cancelled ? 'cancelled' : ''}`} key={trip.id}><div className="at-info"><div className="at-date">{formatDate(trip.date)}{trip.cancelled ? ' - ODWOŁANY' : ''}</div><div className="at-sub">{tripUsedSeats(trip)}/{tripMaxSeats(trip)} miejsc zajętych</div></div>{trip.cancelled ? <button className="restore-btn" onClick={() => toggleTrip(trip.id, false)} type="button">Przywróć</button> : <button className="cancel-btn" onClick={() => toggleTrip(trip.id, true)} type="button">Odwołaj</button>}</div>)}
    </div>
  );
}

function AdminBuses({ adminBusViewMonth, setAdminBusViewMonth, selectedAdminBus, setSelectedAdminBus, cachedAdminBusAvailability, toggleAdminBusDate, adminBusNote, adminBusLoading }) {
  const range = monthRange(adminBusViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const row = cachedAdminBusAvailability.find((item) => item.bus_id === selectedAdminBus && item.date === dateStr);
    const isAvailable = row ? row.available !== false : defaultBusAvailable(dateStr);
    const label = isAvailable ? 'Dostępny' : 'Niedostępny';
    cells.push(<button key={dateStr} className={`calendar-day ${isAvailable ? 'available' : 'unavailable'}`} onClick={() => toggleAdminBusDate(dateStr)} type="button" title={label} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${label}`}><header><span className="day-number">{day}</span></header></button>);
  }

  return (
    <div className="admin-calendar-section">
      <div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminBusViewMonth(new Date(range.year, range.month - 1, 1))} type="button">‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminBusViewMonth(new Date(range.year, range.month + 1, 1))} type="button">›</button></div>
      <div className="route-switch"><button className={selectedAdminBus === 'bus9' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus9')} type="button">{BUS_DETAILS.bus9.name}</button><button className={selectedAdminBus === 'bus8' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus8')} type="button">{BUS_DETAILS.bus8.name}</button></div>
      {adminBusLoading ? <div className="loading-box">Ładuję dostępność busów...</div> : null}
      <Weekdays />
      <div className="calendar-grid">{cells}</div>
      <CalendarLegend items={[{ type: 'available', label: 'Dostępny' }, { type: 'blocked', label: 'Niedostępny' }]} />
      <div className="no-trips mt-sm">{adminBusNote}</div>
    </div>
  );
}

function AdminReservations({ adminReservations, adminReservationsLoading }) {
  if (adminReservationsLoading) return <div className="loading-box">Ładuję rezerwacje...</div>;
  if (!adminReservations.length) return <div className="no-trips">Brak rezerwacji.</div>;
  return adminReservations.map((res) => <div className="res-card" key={res.id}><div className="res-head"><div><strong>{res.passenger_name}</strong><span>{res.passenger_email}{res.passenger_phone ? ` · ${res.passenger_phone}` : ''}</span></div><span className={`badge ${res.status === 'confirmed' ? 'badge-ok' : 'badge-cancel'}`}>{res.seats} miejsce(a)</span></div><p className="muted">{res.trips?.route === 'JW' ? 'Jarosław -> Wiedeń' : 'Wiedeń -> Jarosław'} · {res.trips?.date ? formatDate(res.trips.date) : '-'}</p>{res.notes ? <p className="muted">Uwagi: {res.notes}</p> : null}</div>);
}
