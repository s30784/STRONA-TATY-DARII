import { Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { CalendarLegend } from '../components/CalendarLegend.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { formatDate, monthRange } from '../lib/date.js';
import { tripDate, tripFreeSeats } from '../lib/trips.js';

function formatPrice(price) {
  const amount = Number(price?.price_per_seat);
  if (!Number.isFinite(amount) || amount <= 0) return 'Cena do potwierdzenia';
  const formattedAmount = new Intl.NumberFormat('pl-PL', {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);
  return `${formattedAmount} ${price.currency || 'PLN'}`;
}

export function BookingPage(props) {
  const {
    selectedRoute,
    setSelectedRoute,
    routeDetails,
    bookingViewMonth,
    setBookingViewMonth,
    cachedTrips,
    selectedTripId,
    selectedBookingDate,
    selectBookingDay,
    pickupStop,
    dropoffStop,
    fixedDropoffStop,
    setPickupStop,
    setDropoffStop,
    chooseStop,
    submitBooking,
    bookingMsg,
    bookingSubmitting,
    bookingLoading,
    currentUser,
    currentProfile,
    tripPrice
  } = props;

  const emailConfirmed = Boolean(currentUser?.email_confirmed_at || currentUser?.confirmed_at);
  const priceLabel = formatPrice(tripPrice);
  const dropoffLocked = Boolean(fixedDropoffStop);
  const displayedDropoffStop = dropoffLocked ? fixedDropoffStop : dropoffStop;
  const range = monthRange(bookingViewMonth);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];
  let availableCount = 0;

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  }

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const trip = cachedTrips.find((item) => item.route === selectedRoute && tripDate(item) === dateStr);
    let statusLabel = 'Brak kursu';
    let classes = 'calendar-day disabled';
    let disabled = true;
    let freeSeats = null;
    if (trip) {
      if (trip.cancelled) {
        statusLabel = 'Odwołany';
        classes = 'calendar-day cancelled';
      } else {
        freeSeats = tripFreeSeats(trip);
      }
      if (!trip.cancelled && freeSeats <= 0) {
        statusLabel = 'Brak miejsc';
      } else if (!trip.cancelled && freeSeats > 0) {
        availableCount += 1;
        statusLabel = `Dostępny, wolne miejsca: ${freeSeats}`;
        classes = `calendar-day available ${selectedTripId === trip.id ? 'confirmed' : ''}`;
        disabled = false;
      }
    }
    cells.push(
      <button key={dateStr} className={classes} disabled={disabled} onClick={() => selectBookingDay(dateStr)} type="button" title={statusLabel} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${statusLabel}`}>
        <header>
          <span className="day-number">{day}</span>
          {freeSeats > 0 ? <span className="seat-count" aria-label={`${freeSeats} wolnych miejsc`}>{freeSeats}</span> : null}
          {freeSeats > 0 ? <span className="day-price">{priceLabel}</span> : null}
        </header>
      </button>
    );
  }

  const meta = currentUser?.user_metadata || {};
  const reservationFormVisible = Boolean(selectedBookingDate && currentUser && emailConfirmed);

  return (
    <div className="page active">
      <Hero title="Busy Jarosław - Wiedeń" text="Sprawdź trasę, przystanki i dostępne terminy. Rezerwacja zamyka się automatycznie, gdy nie ma już wolnych miejsc." />
      <section className="section">
        <div className="seo-panel mb">
          <h2>Przewóz osób Jarosław Wiedeń</h2>
          <p>Busy Jarosław Wiedeń i Wiedeń Jarosław możesz sprawdzić w kalendarzu poniżej. Przy dostępnym kursie widać wolne miejsca, cenę przejazdu i formularz rezerwacji miejsca.</p>
          <p>Na trasie Jarosław - Wiedeń przystanki po stronie Polski służą do wsiadania, a wysiadanie odbywa się w Wiedniu.</p>
          <p>Jeżeli potrzebujesz przejazdu dla większej grupy albo masz pytanie o trasę, skorzystaj z formularza lub przejdź do kontaktu.</p>
          <div className="seo-text-actions"><Link className="btn-outline" to="/contact">Kontakt w sprawie przejazdu</Link></div>
        </div>
        <div className="route-switch">
          <button className={selectedRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedRoute('JW')} type="button">{'Jarosław -> Wiedeń'}</button>
          <button className={selectedRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedRoute('WJ')} type="button">{'Wiedeń -> Jarosław'}</button>
        </div>
        <div className="price-callout"><span>Cena miejsca</span><strong>{priceLabel}</strong></div>
        {dropoffLocked ? <p className="form-help route-rule-note">Na trasie Jarosław → Wiedeń wysiadanie jest możliwe tylko w Wiedniu.</p> : null}
        <div className="split-layout mb">
          <Card title={routeDetails.title}>
            <RouteDiagram routeDetails={routeDetails} chooseStop={chooseStop} pickupStop={pickupStop} dropoffStop={displayedDropoffStop} fixedDropoffStop={fixedDropoffStop} />
          </Card>
          <Card title="Przystanki na trasie">
            <div className="stops-grid">
              {routeDetails.stops.map((stop, index) => {
                const isPickup = pickupStop === stop.name;
                const isDropoff = displayedDropoffStop === stop.name;
                return (
                  <button className={`stop-item ${isPickup ? 'selected-pickup' : ''} ${isDropoff ? 'selected-dropoff' : ''}`} key={stop.name} type="button" onClick={() => chooseStop(index, 'pickup')}>
                    <strong>{index + 1}. {stop.name}</strong>
                    <span>{stop.desc}</span>
                    <SelectedStopBadges isPickup={isPickup} isDropoff={isDropoff} />
                  </button>
                );
              })}
            </div>
          </Card>
        </div>
        <p className="step-label">1. Wybierz termin przejazdu</p>
        <div className="calendar-controls">
          <div className="month-title">{MONTHS[range.month]} {range.year}</div>
          <div>
            <button className="month-btn" onClick={() => setBookingViewMonth(new Date(range.year, range.month - 1, 1))} type="button">‹</button>
            <button className="month-btn" onClick={() => setBookingViewMonth(new Date(range.year, range.month + 1, 1))} type="button">›</button>
          </div>
        </div>
        {bookingLoading ? <div className="loading-box">Ładuję terminy i wolne miejsca...</div> : null}
        <Weekdays />
        <div className="calendar-grid">{cells}</div>
        <CalendarLegend items={[{ type: 'available', label: 'Dostępny' }, { type: 'selected', label: 'Wybrany' }, { type: 'seats', label: 'Liczba = wolne miejsca' }, { type: 'blocked', label: 'Niedostępny' }]} />
        <div className="no-trips mt-sm">{availableCount ? 'Kliknij dostępny dzień, aby wybrać termin.' : 'Brak dostępnych terminów w tym miesiącu dla wybranej trasy.'}</div>
        {!reservationFormVisible ? <Message message={bookingMsg} /> : null}
        {selectedBookingDate && !currentUser ? (
          <Card>
            <p className="form-help">Zaloguj się i potwierdź adres email, aby wysłać zgłoszenie rezerwacji.</p>
            <Link className="btn-primary" to="/auth">Zaloguj się</Link>
          </Card>
        ) : null}
        {selectedBookingDate && currentUser && !emailConfirmed ? (
          <Card>
            <p className="form-help">Potwierdź adres email przed wysłaniem zgłoszenia rezerwacji. Link potwierdzający znajdziesz w wiadomości z Supabase.</p>
          </Card>
        ) : null}
        {reservationFormVisible ? (
          <form className="booking-form" onSubmit={submitBooking}>
            <p className="step-label">2. Dane pasażera</p>
            <Card>
              <div className="fg2"><div className="fg"><label>Imię i nazwisko</label><input name="name" defaultValue={meta.full_name || ''} autoComplete="name" /></div><div className="fg"><label>Email</label><input type="email" name="email" defaultValue={currentUser?.email || ''} autoComplete="email" /></div></div>
              <div className="fg2"><div className="fg"><label>Telefon</label><input type="tel" name="phone" defaultValue={currentProfile?.phone || ''} autoComplete="tel" /></div><div className="fg"><label>Liczba miejsc</label><input type="hidden" name="seats" value="1" /><input type="text" value="1" readOnly /></div></div>
              <p className="form-help">Chcesz zarezerwować więcej miejsc? Skontaktuj się z nami bezpośrednio.</p>
              <datalist id="booking-route-stops">{routeDetails.stops.map((stop) => <option key={stop.name} value={stop.name} />)}</datalist>
              <div className="fg2">
                <div className="fg"><label>Wsiadam tutaj</label><input list="booking-route-stops" name="pickup_stop" value={pickupStop} onChange={(e) => setPickupStop(e.target.value)} placeholder="Wybierz lub wpisz miejsce" /></div>
                <div className="fg">
                  <label>Wysiadam tutaj</label>
                  <input list={dropoffLocked ? undefined : 'booking-route-stops'} name="dropoff_stop" value={displayedDropoffStop} readOnly={dropoffLocked} onChange={dropoffLocked ? undefined : (e) => setDropoffStop(e.target.value)} placeholder="Wybierz lub wpisz miejsce" />
                  {dropoffLocked ? <p className="form-help field-note">Na trasie Jarosław → Wiedeń wysiadanie jest możliwe tylko w Wiedniu.</p> : null}
                </div>
              </div>
              <div className="fg"><label>Uwagi</label><input name="notes" placeholder="np. bagaż ponadgabarytowy" /></div>
              <div className="booking-summary">
                <div><span>Termin</span><strong>{formatDate(selectedBookingDate)}</strong></div>
                <div><span>Trasa</span><strong>{routeDetails.title}</strong></div>
                <div><span>Wsiadam</span><strong>{pickupStop || '-'}</strong></div>
                <div><span>Wysiadam</span><strong>{displayedDropoffStop || '-'}</strong></div>
                <div><span>Cena miejsca</span><strong>{priceLabel}</strong></div>
              </div>
              <Message message={bookingMsg} />
              <label className="check-row"><input type="checkbox" name="terms" required /> Akceptuję regulamin i zasady anulowania.</label>
              <button className="btn-primary" disabled={bookingSubmitting} type="submit">{bookingSubmitting ? 'Wysyłam zgłoszenie...' : 'Wyślij zgłoszenie rezerwacji'}</button>
            </Card>
          </form>
        ) : null}
      </section>
    </div>
  );
}

function SelectedStopBadges({ isPickup, isDropoff }) {
  if (!isPickup && !isDropoff) return null;
  return (
    <span className="selected-stop-badges">
      {isPickup ? <span className="selected-stop-chip pickup">Wsiadam</span> : null}
      {isDropoff ? <span className="selected-stop-chip dropoff">Wysiadam</span> : null}
    </span>
  );
}

function RouteDiagram({ routeDetails, chooseStop, pickupStop, dropoffStop, fixedDropoffStop }) {
  const dropoffLocked = Boolean(fixedDropoffStop);
  return (
    <div className="route-diagram">
      <div className="route-line"></div>
      {routeDetails.stops.map((stop, index) => {
        const isPickup = pickupStop === stop.name;
        const isDropoff = dropoffStop === stop.name;
        const dropoffDisabled = dropoffLocked && stop.name !== fixedDropoffStop;
        return (
          <div className={`route-stop-wrap ${isPickup ? 'selected-pickup' : ''} ${isDropoff ? 'selected-dropoff' : ''}`} key={stop.name}>
            <button className={`route-stop ${index === 0 ? 'start' : index === routeDetails.stops.length - 1 ? 'end' : ''}`} type="button" onClick={() => chooseStop(index, 'pickup')}>
              <span className="route-dot">{index + 1}</span>
              <span>
                <strong>{stop.name}</strong>
                <span>{stop.desc}</span>
                <SelectedStopBadges isPickup={isPickup} isDropoff={isDropoff} />
              </span>
            </button>
            <div className="route-actions">
              <button className={isPickup ? 'selected-action' : ''} type="button" onClick={() => chooseStop(index, 'pickup')} aria-pressed={isPickup}>Wsiadam tutaj</button>
              <button className={isDropoff ? 'selected-action' : ''} type="button" onClick={() => chooseStop(index, 'dropoff')} aria-pressed={isDropoff} disabled={dropoffDisabled}>Wysiadam tutaj</button>
            </div>
          </div>
        );
      })}
      <a className="map-link" href={routeDetails.mapUrl} target="_blank" rel="noreferrer">Otwórz trasę w Google Maps</a>
    </div>
  );
}
