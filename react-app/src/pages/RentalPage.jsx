import { Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { CalendarLegend } from '../components/CalendarLegend.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { TurnstileWidget } from '../components/TurnstileWidget.jsx';
import { Weekdays } from '../components/Weekdays.jsx';
import { MONTHS } from '../data/constants.js';
import { BUS_DETAILS, busIdFromLabel } from '../data/vehicles.js';
import { daysInclusive, formatDate, monthRange, todayStr } from '../lib/date.js';

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
  if (status === 'reserved') return 'Zarezerwowany';
  if (status === 'maintenance') return 'Serwis';
  if (status === 'private_use') return 'Użytek prywatny';
  return 'Niedostępny';
}

function selectedRangeText(startDate, endDate) {
  if (!startDate || !endDate) return '';
  if (startDate === endDate) return formatDate(startDate);
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}

export function RentalPage(props) {
  const {
    selectedBus,
    setSelectedBus,
    rentalViewMonth,
    setRentalViewMonth,
    rentalBlocks,
    rentalRangeStart,
    rentalRangeEnd,
    setRentalRange,
    rentalRangeError,
    submitRentalRequest,
    rentalMsg,
    rentalSubmitting,
    rentalLoading,
    currentUser,
    contactPhone,
    contactPhoneHref,
    onTurnstileVerify,
    turnstileResetKey
  } = props;
  const bus = BUS_DETAILS[selectedBus];
  const rangeText = selectedRangeText(rentalRangeStart, rentalRangeEnd);
  const rentalDays = daysInclusive(rentalRangeStart, rentalRangeEnd);
  const submitDisabled = rentalSubmitting || !selectedBus || !rentalRangeStart || !rentalRangeEnd || Boolean(rentalRangeError);

  return (
    <div className="page active">
      <Hero title="Wynajem busa w Jarosławiu i na Podkarpaciu" text="Wybierz pojazd, zakres dat i wyślij zapytanie o wynajem bez logowania." />
      <section className="section">
        <div className="seo-panel mb">
          <h2>Bus do wynajęcia Jarosław i okolice</h2>
          <p>Wynajem busa Jarosław i wynajem busa Podkarpacie to rozwiązanie dla wyjazdów rodzinnych, firmowych oraz transportu grupowego po wcześniejszym ustaleniu szczegółów. Wybierz bus do wynajęcia, zaznacz termin i wyślij zapytanie.</p>
          <p>Obsługujemy zapytania z Jarosławia, okolic Jarosławia, Przeworska, Przemyśla i Rzeszowa. Trasy indywidualne oraz dłuższe przejazdy ustalamy telefonicznie.</p>
          <div className="seo-text-actions"><Link className="btn-outline" to="/contact">Kontakt w sprawie wynajmu</Link></div>
        </div>
        <div className="split-layout">
          <div>
            <div className="fleet-grid">
              {Object.entries(BUS_DETAILS).map(([id, item]) => (
                <article className={`fleet-card ${selectedBus === id ? 'selected' : ''}`} key={id}>
                  <img src={item.image} alt={`${item.name} - wynajem busa w Jarosławiu`} />
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
            <Card title="Kalendarz wynajmu">
              {rentalLoading ? <div className="loading-box">Ładuję blokady kalendarza...</div> : null}
              <RentalCalendar
                viewDate={rentalViewMonth}
                setViewDate={setRentalViewMonth}
                blocks={rentalBlocks}
                rangeStart={rentalRangeStart}
                rangeEnd={rentalRangeEnd}
                setRentalRange={setRentalRange}
                rangeError={rentalRangeError}
              />
            </Card>
            <Card title="Zapytanie o wynajem">
              <p className="form-help">W razie pytań możesz też zadzwonić: <a href={contactPhoneHref}>{contactPhone}</a>.</p>
              <Message message={rentalMsg} />
              <form onSubmit={submitRentalRequest}>
                <div className="fg"><label>Wybrany bus</label><select value={BUS_DETAILS[selectedBus].selectLabel} onChange={(e) => setSelectedBus(busIdFromLabel(e.target.value))}>{Object.values(BUS_DETAILS).map((item) => <option key={item.name}>{item.selectLabel}</option>)}</select></div>
                <div className="fg2"><div className="fg"><label>Data od</label><input type="date" value={rentalRangeStart || ''} min={todayStr()} onChange={(e) => setRentalRange(e.target.value, rentalRangeEnd || e.target.value)} /></div><div className="fg"><label>Data do</label><input type="date" value={rentalRangeEnd || ''} min={rentalRangeStart || todayStr()} onChange={(e) => setRentalRange(rentalRangeStart || e.target.value, e.target.value)} /></div></div>
                <div className="fg"><label>Wybrany termin</label><input type="text" value={rangeText ? `Wybrany termin: ${rangeText}` : ''} placeholder="Wybierz początek i koniec w kalendarzu" readOnly /></div>
                <div className="fg"><label>Liczba dni</label><input type="text" value={rentalDays ? `${rentalDays} ${rentalDays === 1 ? 'dzień' : 'dni'}` : ''} placeholder="-" readOnly /></div>
                <div className={`range-status ${rentalRangeError ? 'err' : rentalRangeStart && rentalRangeEnd ? 'ok' : ''}`}>{rentalRangeError || (rentalRangeStart && rentalRangeEnd ? 'Wybrany zakres jest dostępny według aktualnego kalendarza.' : 'Wybierz datę od i datę do.')}</div>
                <div className="fg"><label>Email</label><input type="email" name="email" defaultValue={currentUser?.email || ''} placeholder="jan@example.com" autoComplete="email" /></div>
                <div className="fg"><label>Telefon</label><input type="tel" name="phone" placeholder="+48 000 000 000" autoComplete="tel" /></div>
                <div className="fg"><label>Opis wyjazdu</label><textarea name="notes" rows="3" placeholder="np. wesele, lotnisko, wyjazd firmowy"></textarea></div>
                <TurnstileWidget onVerify={onTurnstileVerify} resetKey={turnstileResetKey} />
                <button className="btn-primary" type="submit" disabled={submitDisabled}>{rentalSubmitting ? 'Zapisuję zapytanie...' : 'Wyślij zapytanie'}</button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}

function RentalCalendar({ viewDate, setViewDate, blocks, rangeStart, rangeEnd, setRentalRange, rangeError }) {
  const range = monthRange(viewDate);
  const firstDay = new Date(range.year, range.month, 1).getDay();
  const startOffset = (firstDay + 6) % 7;
  const cells = [];

  function selectDate(dateStr) {
    if (!rangeStart || (rangeStart && rangeEnd && rangeStart !== rangeEnd)) {
      setRentalRange(dateStr, dateStr);
      return;
    }
    if (dateStr < rangeStart) {
      setRentalRange(dateStr, dateStr);
      return;
    }
    setRentalRange(rangeStart, dateStr);
  }

  for (let i = 0; i < startOffset; i += 1) {
    cells.push(<div className="calendar-day disabled" key={`empty-${i}`}></div>);
  }

  for (let day = 1; day <= range.days; day += 1) {
    const dateStr = `${range.year}-${String(range.month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const block = (blocks || []).find((item) => blockCoversDate(item, dateStr));
    const isBlocked = Boolean(block);
    const isPast = dateStr < todayStr();
    const isSelected = rangeStart && rangeEnd && rangeStart <= dateStr && dateStr <= rangeEnd;
    const disabled = isPast || isBlocked;
    const invalidSelected = isSelected && Boolean(rangeError);
    const classes = `calendar-day ${disabled ? isBlocked ? 'unavailable' : 'disabled' : 'available'} ${isSelected ? 'confirmed range-selected' : ''} ${invalidSelected ? 'range-invalid' : ''}`;
    const statusLabel = isPast ? 'Minął' : isBlocked ? `${blockStatusLabel(block.status)}${block.public_note ? ` - ${block.public_note}` : ''}` : 'Dostępny';
    cells.push(
      <button key={dateStr} className={classes} onClick={() => !disabled && selectDate(dateStr)} type="button" disabled={disabled} title={statusLabel} aria-label={`${day} ${MONTHS[range.month]} ${range.year}: ${statusLabel}`}>
        <header><span className="day-number">{day}</span></header>
      </button>
    );
  }

  const rangeText = selectedRangeText(rangeStart, rangeEnd);
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
      <CalendarLegend items={[{ type: 'available', label: 'Dostępny' }, { type: 'selected', label: 'Wybrany zakres' }, { type: 'blocked', label: 'Niedostępny' }, { type: 'muted', label: 'Minął' }]} />
      <div className="no-trips mt-sm">{rangeError || (rangeText ? `Wybrany termin: ${rangeText}` : 'Kliknij datę początkową, a potem końcową albo wpisz daty w formularzu.')}</div>
    </>
  );
}
