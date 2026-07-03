import { Message } from '../components/Message.jsx';
import { CalendarLegend } from '../components/CalendarLegend.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { BUS_DETAILS } from '../data/vehicles.js';
import { formatDate, monthRange } from '../lib/date.js';
import { tripDate, tripFreeSeats, tripMaxSeats, tripUsedSeats } from '../lib/trips.js';

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
    adminSetReservationStatus,
    adminSetPaymentStatus,
    tripPrices,
    adminSetTripPrice,
    adminRentalRequests,
    adminTowRequests,
    adminRequestsLoading,
    adminUpdateRentalRequest,
    adminUpdateTowRequest,
    adminBlockViewMonth,
    setAdminBlockViewMonth,
    selectedAdminBus,
    setSelectedAdminBus,
    adminRentalBlocks,
    adminBlockMsg,
    adminBlocksLoading,
    addAdminRentalBlock,
    deactivateAdminRentalBlock
  } = props;

  return (
    <div className="page active">
      <section className="section">
        <div className="panel-head"><h2>Panel właściciela</h2></div>
        <div className="atabs">
          <button className={`atab ${adminTab === 'trips' ? 'active' : ''}`} onClick={() => setAdminTab('trips')} type="button">Terminy kursów</button>
          <button className={`atab ${adminTab === 'buses' ? 'active' : ''}`} onClick={() => setAdminTab('buses')} type="button">Blokady wynajmu</button>
          <button className={`atab ${adminTab === 'res' ? 'active' : ''}`} onClick={() => setAdminTab('res')} type="button">Rezerwacje</button>
          <button className={`atab ${adminTab === 'prices' ? 'active' : ''}`} onClick={() => setAdminTab('prices')} type="button">Ceny</button>
          <button className={`atab ${adminTab === 'requests' ? 'active' : ''}`} onClick={() => setAdminTab('requests')} type="button">Zapytania</button>
        </div>
        {adminTab === 'trips' ? <AdminTrips adminViewMonth={adminViewMonth} setAdminViewMonth={setAdminViewMonth} selectedAdminRoute={selectedAdminRoute} setSelectedAdminRoute={setSelectedAdminRoute} cachedAdminTrips={cachedAdminTrips} toggleAdminTripDate={toggleAdminTripDate} generateMonth={generateMonth} adminGenMsg={adminGenMsg} toggleTrip={toggleTrip} adminTripsLoading={adminTripsLoading} /> : null}
        {adminTab === 'buses' ? <AdminRentalBlocks adminBlockViewMonth={adminBlockViewMonth} setAdminBlockViewMonth={setAdminBlockViewMonth} selectedAdminBus={selectedAdminBus} setSelectedAdminBus={setSelectedAdminBus} blocks={adminRentalBlocks} adminBlockMsg={adminBlockMsg} loading={adminBlocksLoading} addBlock={addAdminRentalBlock} deactivateBlock={deactivateAdminRentalBlock} /> : null}
        {adminTab === 'res' ? <AdminReservations adminReservations={adminReservations} adminReservationsLoading={adminReservationsLoading} adminSetReservationStatus={adminSetReservationStatus} adminSetPaymentStatus={adminSetPaymentStatus} /> : null}
        {adminTab === 'prices' ? <AdminPrices tripPrices={tripPrices} adminSetTripPrice={adminSetTripPrice} /> : null}
        {adminTab === 'requests' ? <AdminRequests rentalRequests={adminRentalRequests} towRequests={adminTowRequests} loading={adminRequestsLoading} updateRentalRequest={adminUpdateRentalRequest} updateTowRequest={adminUpdateTowRequest} /> : null}
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
    const freeSeats = trip && !trip.cancelled ? tripFreeSeats(trip) : null;
    const label = trip ? trip.cancelled ? 'Anulowany' : `Aktywny, wolne miejsca: ${freeSeats}` : 'Dodaj';
    cells.push(<button key={dateStr} className={`calendar-day ${trip?.cancelled ? 'cancelled' : trip ? 'confirmed' : ''}`} onClick={() => toggleAdminTripDate(dateStr)} type="button" title={label} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${label}`}><header><span className="day-number">{day}</span>{freeSeats !== null ? <span className="seat-count" aria-label={`${freeSeats} wolnych miejsc`}>{freeSeats}</span> : null}</header></button>);
  }

  return (
    <>
      <div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month - 1, 1))} type="button">‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminViewMonth(new Date(range.year, range.month + 1, 1))} type="button">›</button></div>
      <div className="admin-calendar-section">
        <div className="route-switch"><button className={selectedAdminRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedAdminRoute('JW')} type="button">JW</button><button className={selectedAdminRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedAdminRoute('WJ')} type="button">WJ</button></div>
        {adminTripsLoading ? <div className="loading-box">Ładuję terminy kursów...</div> : null}
        <Weekdays />
        <div className="calendar-grid">{cells}</div>
        <CalendarLegend items={[{ type: 'available', label: 'Aktywny' }, { type: 'seats', label: 'Liczba = wolne miejsca' }, { type: 'blocked', label: 'Anulowany' }, { type: 'empty', label: 'Brak kursu' }]} />
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

const BLOCK_STATUSES = [
  ['unavailable', 'Niedostępny'],
  ['reserved', 'Zarezerwowany'],
  ['maintenance', 'Serwis'],
  ['private_use', 'Użytek prywatny']
];

function blockStart(block) {
  return String(block?.start_date || '').slice(0, 10);
}

function blockEnd(block) {
  return String(block?.end_date || block?.start_date || '').slice(0, 10);
}

function blockCoversDate(block, dateStr) {
  return blockStart(block) <= dateStr && dateStr <= blockEnd(block);
}

function blockStatusLabel(status) {
  return BLOCK_STATUSES.find(([value]) => value === status)?.[1] || status || 'Niedostępny';
}

function blockRangeLabel(block) {
  const start = blockStart(block);
  const end = blockEnd(block);
  if (!start) return '-';
  if (start === end) return formatDate(start);
  return `${formatDate(start)} - ${formatDate(end)}`;
}

function AdminRentalBlocks({ adminBlockViewMonth, setAdminBlockViewMonth, selectedAdminBus, setSelectedAdminBus, blocks, adminBlockMsg, loading, addBlock, deactivateBlock }) {
  const range = monthRange(adminBlockViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];

  for (let i = 0; i < startOffset; i += 1) cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const block = (blocks || []).find((item) => blockCoversDate(item, dateStr));
    const label = block ? `${blockStatusLabel(block.status)}${block.public_note ? ` - ${block.public_note}` : ''}` : 'Brak blokady';
    cells.push(<div key={dateStr} className={`calendar-day ${block ? 'unavailable' : ''}`} title={label} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${label}`}><header><span className="day-number">{day}</span></header></div>);
  }

  return (
    <>
      <div className="admin-calendar-section">
      <div className="admin-month-ctrl"><button className="month-btn" onClick={() => setAdminBlockViewMonth(new Date(range.year, range.month - 1, 1))} type="button">‹</button><span>{MONTHS[range.month]} {range.year}</span><button className="month-btn" onClick={() => setAdminBlockViewMonth(new Date(range.year, range.month + 1, 1))} type="button">›</button></div>
      <div className="route-switch"><button className={selectedAdminBus === 'bus9' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus9')} type="button">{BUS_DETAILS.bus9.name}</button><button className={selectedAdminBus === 'bus8' ? 'active' : ''} onClick={() => setSelectedAdminBus('bus8')} type="button">{BUS_DETAILS.bus8.name}</button></div>
      {loading ? <div className="loading-box">Ładuję blokady wynajmu...</div> : null}
      <Weekdays />
      <div className="calendar-grid">{cells}</div>
      <CalendarLegend items={[{ type: 'blocked', label: 'Blokada' }, { type: 'empty', label: 'Brak blokady' }]} />
      <div className="no-trips mt-sm">Dodawaj zakresy niedostępności dla wybranego busa.</div>
      </div>
      <Message message={adminBlockMsg} />
      <form className="admin-block-form" onSubmit={addBlock}>
        <div className="fg"><label>Początek</label><input type="date" name="start_date" required /></div>
        <div className="fg"><label>Koniec</label><input type="date" name="end_date" required /></div>
        <div className="fg"><label>Status</label><select name="status" defaultValue="unavailable">{BLOCK_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
        <div className="fg"><label>Notatka publiczna</label><input name="public_note" placeholder="np. zajęty termin" /></div>
        <button className="btn-primary" type="submit">Dodaj blokadę</button>
      </form>
      <div className="admin-list-block">
        <p className="admin-route-title">Aktywne blokady: {BUS_DETAILS[selectedAdminBus].name}</p>
        {!blocks.length ? <p className="muted">Brak blokad w tym miesiącu.</p> : null}
        {blocks.map((block) => (
          <div className="res-card" key={block.id}>
            <div className="res-head"><div><strong>{blockStatusLabel(block.status)}</strong><span>{blockRangeLabel(block)}</span></div><span className="badge badge-few">{block.status}</span></div>
            {block.public_note ? <p className="muted">Notatka: {block.public_note}</p> : null}
            <div className="res-actions"><button className="cancel-btn" onClick={() => deactivateBlock(block.id)} type="button">Usuń blokadę</button></div>
          </div>
        ))}
      </div>
    </>
  );
}

const ADMIN_RESERVATION_ACTIONS = [
  ['accepted', 'Akceptuj', 'restore-btn'],
  ['payment_pending', 'Oczekuje na płatność', 'status-btn'],
  ['confirmed', 'Potwierdź', 'restore-btn'],
  ['rejected', 'Odrzuć', 'cancel-btn'],
  ['cancelled_admin', 'Anuluj', 'cancel-btn']
];

const REQUEST_STATUSES = [
  ['new', 'Nowe'],
  ['contacted', 'Kontakt'],
  ['priced', 'Wycenione'],
  ['accepted', 'Przyjęte'],
  ['rejected', 'Odrzucone'],
  ['closed', 'Zamknięte']
];

function formatMoney(amount, currency = 'PLN') {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return 'Do ustalenia';
  return `${value.toFixed(2)} ${currency}`;
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value == null) return [];
  return [value];
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

function adminStatusLabel(status) {
  if (status === 'requested') return 'Zgłoszenie';
  if (status === 'accepted') return 'Zaakceptowana';
  if (status === 'payment_pending') return 'Oczekuje na płatność';
  if (status === 'paid') return 'Opłacona';
  if (status === 'confirmed') return 'Potwierdzona';
  if (status === 'rejected') return 'Odrzucona';
  if (status === 'cancelled_user') return 'Anulowana przez klienta';
  if (status === 'cancelled_admin') return 'Anulowana przez admina';
  if (status === 'expired') return 'Wygasła';
  return status || '-';
}

function adminStatusBadgeClass(status) {
  if (['accepted', 'payment_pending', 'paid', 'confirmed'].includes(status)) return 'badge-ok';
  if (status === 'requested') return 'badge-few';
  return 'badge-cancel';
}

function AdminReservations({ adminReservations, adminReservationsLoading, adminSetReservationStatus, adminSetPaymentStatus }) {
  if (adminReservationsLoading) return <div className="loading-box">Ładuję rezerwacje...</div>;
  if (!adminReservations.length) return <div className="no-trips">Brak rezerwacji.</div>;
  const requested = adminReservations.filter((res) => res.status === 'requested');
  const other = adminReservations.filter((res) => res.status !== 'requested');
  return (
    <>
      <AdminReservationGroup title={`Nowe zgłoszenia (${requested.length})`} reservations={requested} adminSetReservationStatus={adminSetReservationStatus} adminSetPaymentStatus={adminSetPaymentStatus} />
      <AdminReservationGroup title="Pozostałe rezerwacje" reservations={other} adminSetReservationStatus={adminSetReservationStatus} adminSetPaymentStatus={adminSetPaymentStatus} />
    </>
  );
}

function AdminReservationGroup({ title, reservations, adminSetReservationStatus, adminSetPaymentStatus }) {
  return (
    <div className="admin-list-block">
      <p className="admin-route-title">{title}</p>
      {!reservations.length ? <p className="muted">Brak pozycji.</p> : null}
      {reservations.map((res) => <AdminReservationCard key={res.id} res={res} adminSetReservationStatus={adminSetReservationStatus} adminSetPaymentStatus={adminSetPaymentStatus} />)}
    </div>
  );
}

function AdminReservationCard({ res, adminSetReservationStatus, adminSetPaymentStatus }) {
  const payment = asArray(res.payments).slice().sort((a, b) => dateMs(b.created_at) - dateMs(a.created_at))[0];
  const paymentCurrency = payment?.currency || res.currency || 'PLN';
  function onPaymentSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const submitter = event.nativeEvent.submitter;
    adminSetPaymentStatus(
      res.id,
      submitter?.value || 'paid',
      String(form.get('method') || 'cash'),
      Number(form.get('amount') || 0),
      paymentCurrency,
      String(form.get('note') || '')
    );
  }

  return (
    <div className="res-card">
      <div className="res-head"><div><strong>{res.passenger_name}</strong><span>{res.passenger_email}{res.passenger_phone ? ` · ${res.passenger_phone}` : ''}</span></div><span className={`badge ${adminStatusBadgeClass(res.status)}`}>{adminStatusLabel(res.status)} · {res.seats} miejsce(a)</span></div>
      <p className="muted">{res.trips?.route === 'JW' ? 'Jarosław -> Wiedeń' : 'Wiedeń -> Jarosław'} · {res.trips?.date ? formatDate(res.trips.date) : '-'}</p>
      <p className="muted">Cena snapshot: {formatMoney(res.total_price_snapshot, res.currency)} · Płatność: {payment?.status || 'unpaid'}</p>
      {res.notes ? <p className="muted">Uwagi: {res.notes}</p> : null}
      <div className="res-actions">{ADMIN_RESERVATION_ACTIONS.map(([status, label, className]) => <button key={status} className={className} onClick={() => adminSetReservationStatus(res.id, status)} type="button" disabled={res.status === status}>{label}</button>)}</div>
      <form className="admin-inline-form" onSubmit={onPaymentSubmit}>
        <input name="amount" type="number" min="0" step="0.01" defaultValue={Number(payment?.amount ?? res.total_price_snapshot ?? 0).toFixed(2)} aria-label="Kwota płatności" />
        <select name="method" defaultValue={payment?.method || 'cash'} aria-label="Metoda płatności"><option value="cash">Gotówka</option><option value="blik">BLIK</option><option value="bank_transfer">Przelew</option><option value="other">Inne</option></select>
        <input name="note" defaultValue={payment?.note || ''} placeholder="Notatka płatności" />
        <button className="restore-btn" name="status" value="paid" type="submit">Opłacona</button>
        <button className="status-btn" name="status" value="unpaid" type="submit">Nieopłacona</button>
      </form>
    </div>
  );
}

function AdminPrices({ tripPrices, adminSetTripPrice }) {
  const routes = [
    ['JW', 'Jarosław -> Wiedeń'],
    ['WJ', 'Wiedeń -> Jarosław']
  ];

  function onSubmit(event, route) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    adminSetTripPrice(route, Number(form.get('price') || 0), String(form.get('currency') || 'PLN'));
  }

  return (
    <div className="admin-grid">
      {routes.map(([route, label]) => {
        const price = currentRoutePrice(tripPrices, route);
        return (
          <form className="card" key={route} onSubmit={(event) => onSubmit(event, route)}>
            <h3>{label}</h3>
            <p className="muted">Aktualnie: {formatMoney(price?.price_per_seat, price?.currency)}</p>
            <div className="fg"><label>Cena miejsca</label><input name="price" type="number" min="0" step="0.01" defaultValue={price?.price_per_seat ?? 0} /></div>
            <div className="fg"><label>Waluta</label><select name="currency" defaultValue={price?.currency || 'PLN'}><option value="PLN">PLN</option><option value="EUR">EUR</option></select></div>
            <button className="btn-primary" type="submit">Zapisz cenę</button>
          </form>
        );
      })}
    </div>
  );
}

function AdminRequests({ rentalRequests, towRequests, loading, updateRentalRequest, updateTowRequest }) {
  if (loading) return <div className="loading-box">Ładuję zapytania...</div>;
  return (
    <div className="admin-grid">
      <div>
        <p className="admin-route-title">Zapytania o wynajem busa</p>
        {!rentalRequests.length ? <p className="muted">Brak zapytań.</p> : null}
        {rentalRequests.map((request) => <RentalRequestCard key={request.id} request={request} updateRentalRequest={updateRentalRequest} />)}
      </div>
      <div>
        <p className="admin-route-title">Zapytania o lawetę</p>
        {!towRequests.length ? <p className="muted">Brak zapytań.</p> : null}
        {towRequests.map((request) => <TowRequestCard key={request.id} request={request} updateTowRequest={updateTowRequest} />)}
      </div>
    </div>
  );
}

function RequestStatusSelect({ defaultValue }) {
  return <select name="status" defaultValue={defaultValue}>{REQUEST_STATUSES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>;
}

function RentalRequestCard({ request, updateRentalRequest }) {
  function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateRentalRequest(request.id, String(form.get('status') || 'new'), String(form.get('admin_note') || ''));
  }

  return (
    <form className="res-card" onSubmit={onSubmit}>
      <div className="res-head"><div><strong>{BUS_DETAILS[request.bus_id]?.name || request.bus_id}</strong><span>{request.email} · {request.phone}</span></div><span className="badge badge-few">{request.status}</span></div>
      <p className="muted">{formatDate(request.start_date)}{request.end_date !== request.start_date ? ` - ${formatDate(request.end_date)}` : ''}</p>
      {request.message ? <p className="muted">Opis: {request.message}</p> : null}
      <div className="admin-inline-form"><RequestStatusSelect defaultValue={request.status} /><input name="admin_note" defaultValue={request.admin_note || ''} placeholder="Notatka admina" /><button className="btn-outline" type="submit">Zapisz</button></div>
    </form>
  );
}

function TowRequestCard({ request, updateTowRequest }) {
  function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    updateTowRequest(request.id, String(form.get('status') || 'new'), form.get('estimated_price') ? Number(form.get('estimated_price')) : null, String(form.get('admin_note') || ''));
  }

  return (
    <form className="res-card" onSubmit={onSubmit}>
      <div className="res-head"><div><strong>{request.vehicle_info}</strong><span>{request.email} · {request.phone}</span></div><span className="badge badge-few">{request.status}</span></div>
      <p className="muted">{request.pickup_location} {'->'} {request.dropoff_location}</p>
      {request.message ? <p className="muted">Opis: {request.message}</p> : null}
      <div className="admin-inline-form"><RequestStatusSelect defaultValue={request.status} /><input name="estimated_price" type="number" min="0" step="0.01" defaultValue={request.estimated_price || ''} placeholder="Wycena" /><input name="admin_note" defaultValue={request.admin_note || ''} placeholder="Notatka admina" /><button className="btn-outline" type="submit">Zapisz</button></div>
    </form>
  );
}
