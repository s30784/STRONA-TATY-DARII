export function HomePage({ showPage, currentUser }) {
  const services = [
    ['Wynajem busów', 'Busy dla rodzin, firm, ekip i grup wyjazdowych w okolicach Jarosławia, Przeworska i Rzeszowa.', 'Przejdź do wynajmu', '/rental'],
    ['Przejazdy Jarosław-Wiedeń', 'Regularne kursy z rezerwacją miejsc online i podglądem dostępnych terminów w kalendarzu.', 'Zarezerwuj miejsce', '/booking'],
    ['Transport lawetą', 'Przewóz samochodów i motocykli na trasie Polska-Austria, także przy okazji regularnych wyjazdów.', 'Zamów wycenę', '/tow']
  ];

  return (
    <div className="page active">
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1>Transport dla ludzi, grup i pojazdów na trasie Polska-Austria</h1>
          <p>Wynajem busów w okolicach Rzeszowa i Jarosławia, regularne przejazdy Jarosław-Wiedeń oraz transport lawetą na tej samej trasie.</p>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => showPage('/booking')} type="button">Zarezerwuj przejazd</button>
            <button className="hero-btn secondary" onClick={() => showPage('/rental')} type="button">Sprawdź busy</button>
            {!currentUser ? <button className="hero-btn secondary" onClick={() => showPage('/auth')} type="button">Zaloguj się</button> : null}
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
                <button className="service-link" onClick={() => showPage(page)} type="button">{action}</button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
