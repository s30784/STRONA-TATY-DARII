import { Card } from '../components/Card.jsx';
import { CalendarLegend } from '../components/CalendarLegend.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { BUS_DETAILS, busIdFromLabel } from '../data/vehicles.js';
import { formatDate, monthRange, todayStr } from '../lib/date.js';

export function RentalPage(props) {
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
    rentalSubmitting,
    rentalLoading,
    currentUser
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
                    <button className="btn-outline" onClick={() => setSelectedBus(id)} type="button">Pokaż szczegóły</button>
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
              {rentalLoading ? <div className="loading-box">Ładuję dostępność busa...</div> : null}
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
                <div className="fg"><label>Email</label><input type="email" name="email" defaultValue={currentUser?.email || ''} placeholder="jan@example.com" autoComplete="email" /></div>
                <div className="fg"><label>Telefon</label><input type="tel" name="phone" placeholder="+48 000 000 000" autoComplete="tel" /></div>
                <div className="fg"><label>Opis wyjazdu</label><textarea name="notes" rows="3" placeholder="np. wesele, lotnisko, wyjazd firmowy"></textarea></div>
                <button className="btn-primary" type="submit" disabled={rentalSubmitting}>{rentalSubmitting ? 'Zapisuję zapytanie...' : 'Wyślij zapytanie'}</button>
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

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  }

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const isAvailable = availability.find((item) => item.bus_id === selectedBus && item.date === dateStr)?.available !== false && dateStr >= todayStr();
    const isPast = dateStr < todayStr();
    const selected = selectedDate === dateStr;
    const classes = `calendar-day ${isPast ? 'disabled' : isAvailable ? 'available' : 'disabled'} ${selected ? 'confirmed' : ''}`;
    const statusLabel = isPast ? 'Minął' : isAvailable ? 'Dostępny' : 'Niedostępny';
    cells.push(
      <button key={dateStr} className={classes} onClick={() => !isPast && isAvailable && setSelectedDate(dateStr)} type="button" title={statusLabel} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${statusLabel}`}>
        <header><span className="day-number">{day}</span></header>
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
      <CalendarLegend items={[{ type: 'available', label: 'Dostępny' }, { type: 'selected', label: 'Wybrany' }, { type: 'muted', label: 'Minął / niedostępny' }]} />
      <div className="no-trips mt-sm">{busAvailabilityFallback ? 'Nie udało się pobrać dostępności z systemu. Spróbuj odświeżyć stronę.' : selectedDate ? `Wybrano: ${formatDate(selectedDate)}` : 'Kliknij dostępny dzień, aby wybrać termin.'}</div>
    </>
  );
}
