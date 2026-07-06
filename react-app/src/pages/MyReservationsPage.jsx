import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { formatDate } from '../lib/date.js';

const TERMINAL_STATUSES = ['cancelled_user', 'cancelled_admin', 'rejected', 'expired', 'no_show'];
const CANCELLED_STATUSES = ['cancelled_user', 'cancelled_admin'];

function reservationStatusLabel(status, tripCancelled) {
  if (tripCancelled) return 'anulowana';
  if (status === 'requested') return 'zgłoszenie wysłane';
  if (status === 'accepted' || status === 'payment_pending') return 'oczekuje na potwierdzenie';
  if (status === 'paid' || status === 'confirmed') return 'potwierdzona';
  if (status === 'rejected') return 'odrzucona';
  if (status === 'expired') return 'wygasła';
  if (CANCELLED_STATUSES.includes(status)) return 'anulowana';
  return 'oczekuje na potwierdzenie';
}

export function MyReservationsPage({ currentUser, showPage, myReservations, myResMsg, myReservationsLoading, cancelReservation, cancelingReservationId }) {
  const total = myReservations.length;
  const upcoming = myReservations.filter((res) => res.trips?.date && new Date(res.trips.date) >= new Date() && !TERMINAL_STATUSES.includes(res.status) && !res.trips?.cancelled).length;
  const cancelled = myReservations.filter((res) => CANCELLED_STATUSES.includes(res.status) || res.trips?.cancelled).length;

  return (
    <div className="page active">
      <Hero title="Moje rezerwacje" text="Historia Twoich przejazdów." />
      <section className="section">
        <Message message={myResMsg} />
        {myReservationsLoading ? <div className="loading-box">Ładuję Twoje rezerwacje...</div> : null}
        {!currentUser ? <div className="no-trips">Zaloguj się, aby zobaczyć rezerwacje. <button className="btn-outline mt-sm" onClick={() => showPage('/auth')} type="button">Zaloguj się</button></div> : null}
        {currentUser && !myReservationsLoading && !myReservations.length ? <div className="no-trips">Brak rezerwacji.</div> : null}
        {currentUser && myReservations.length ? (
          <>
            <Card><div className="summary-grid"><Summary label="Łącznie rezerwacji" value={total} /><Summary label="Nadchodzące" value={upcoming} /><Summary label="Odwołane" value={cancelled} /></div></Card>
            {myReservations.map((res) => {
              const route = res.trips?.route;
              const label = reservationStatusLabel(res.status, res.trips?.cancelled);
              const isInactive = TERMINAL_STATUSES.includes(res.status) || res.trips?.cancelled;
              const isCanceling = cancelingReservationId === res.id;
              return <div className="res-card" key={res.id}><div className="res-head"><div><strong>{res.trips?.date ? formatDate(res.trips.date) : '-'}</strong><span>{route === 'JW' ? 'Jarosław -> Wiedeń' : 'Wiedeń -> Jarosław'}</span></div><span className={`badge ${isInactive ? 'badge-cancel' : 'badge-ok'}`}>{label}</span></div><p className="muted">Miejsc: {res.seats}</p>{res.notes ? <p className="muted notes-block">{res.notes}</p> : null}{!isInactive ? <button className="cancel-btn" onClick={() => cancelReservation(res.id)} type="button" disabled={Boolean(cancelingReservationId)}>{isCanceling ? 'Anuluję...' : 'Anuluj rezerwację'}</button> : null}</div>;
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
