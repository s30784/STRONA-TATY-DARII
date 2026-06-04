import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { formatDate } from '../lib/date.js';

export function MyReservationsPage({ currentUser, showPage, myReservations, myResMsg, myReservationsLoading, cancelReservation }) {
  const total = myReservations.length;
  const upcoming = myReservations.filter((res) => res.trips?.date && new Date(res.trips.date) >= new Date()).length;
  const cancelled = myReservations.filter((res) => res.status === 'cancelled' || res.trips?.cancelled).length;

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
              const isCancelled = res.status === 'cancelled' || res.trips?.cancelled;
              return <div className="res-card" key={res.id}><div className="res-head"><div><strong>{res.trips?.date ? formatDate(res.trips.date) : '-'}</strong><span>{route === 'JW' ? 'Jarosław -> Wiedeń' : 'Wiedeń -> Jarosław'}</span></div><span className={`badge ${isCancelled ? 'badge-cancel' : 'badge-ok'}`}>{isCancelled ? 'Anulowana' : 'Potwierdzona'}</span></div><p className="muted">Miejsc: {res.seats}{res.notes ? ` · ${res.notes}` : ''}</p>{!isCancelled ? <button className="cancel-btn" onClick={() => cancelReservation(res.id)} type="button">Anuluj rezerwację</button> : null}</div>;
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
