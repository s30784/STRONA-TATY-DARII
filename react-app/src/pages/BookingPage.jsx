import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { formatDate, monthRange } from '../lib/date.js';
import { tripDate, tripFreeSeats } from '../lib/trips.js';

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
    setPickupStop,
    setDropoffStop,
    chooseStop,
    submitBooking,
    bookingMsg,
    bookingSubmitting,
    bookingLoading,
    currentUser,
    currentProfile
  } = props;

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
    cells.push(
      <button key={dateStr} className={classes} disabled={disabled} onClick={() => selectBookingDay(dateStr)} type="button">
        <header><span className="day-number">{day}</span></header>
        <div className="day-meta">{meta}</div>
      </button>
    );
  }

  const meta = currentUser?.user_metadata || {};

  return (
    <div className="page active">
      <Hero title="Przejazdy Jarosław-Wiedeń" text="Sprawdź trasę, przystanki i dostępne terminy. Rezerwacja zamyka się automatycznie, gdy nie ma już wolnych miejsc." />
      <section className="section">
        <Message message={bookingMsg} />
        <div className="route-switch">
          <button className={selectedRoute === 'JW' ? 'active' : ''} onClick={() => setSelectedRoute('JW')} type="button">{'Jarosław -> Wiedeń'}</button>
          <button className={selectedRoute === 'WJ' ? 'active' : ''} onClick={() => setSelectedRoute('WJ')} type="button">{'Wiedeń -> Jarosław'}</button>
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
        <div className="no-trips mt-sm">{availableCount ? 'Kliknij dostępny dzień, aby wybrać termin.' : 'Brak dostępnych terminów w tym miesiącu dla wybranej trasy.'}</div>
        {selectedBookingDate ? (
          <form className="booking-form" onSubmit={submitBooking}>
            <p className="step-label">2. Dane pasażera</p>
            <Card>
              <div className="fg2"><div className="fg"><label>Imię i nazwisko</label><input name="name" defaultValue={meta.full_name || ''} autoComplete="name" /></div><div className="fg"><label>Email</label><input type="email" name="email" defaultValue={currentUser?.email || ''} autoComplete="email" /></div></div>
              <div className="fg2"><div className="fg"><label>Telefon</label><input type="tel" name="phone" defaultValue={currentProfile?.phone || ''} autoComplete="tel" /></div><div className="fg"><label>Liczba miejsc</label><input type="number" name="seats" min="1" max="7" defaultValue="1" /></div></div>
              <div className="fg2"><div className="fg"><label>Przystanek wsiadania</label><select value={pickupStop} onChange={(e) => setPickupStop(e.target.value)}>{routeDetails.stops.map((stop, index) => <option key={stop.name} value={stop.name}>{index + 1}. {stop.name}</option>)}</select></div><div className="fg"><label>Przystanek wysiadania</label><select value={dropoffStop} onChange={(e) => setDropoffStop(e.target.value)}>{routeDetails.stops.map((stop, index) => <option key={stop.name} value={stop.name}>{index + 1}. {stop.name}</option>)}</select></div></div>
              <div className="fg"><label>Uwagi</label><input name="notes" placeholder="np. bagaż ponadgabarytowy" /></div>
              <button className="btn-primary" disabled={bookingSubmitting} type="submit">{bookingSubmitting ? 'Rezerwuję...' : 'Zarezerwuj miejsce'}</button>
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
