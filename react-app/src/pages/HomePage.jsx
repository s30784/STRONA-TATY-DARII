export function HomePage({ showPage, currentUser, contactEmail, contactPhone, contactPhoneHref }) {
  const services = [
    ['01', 'Wynajem busów', 'Busy dla rodzin, firm, ekip i grup wyjazdowych w okolicach Jarosławia, Przeworska i Rzeszowa.', 'Sprawdź dostępność', '/rental'],
    ['02', 'Przejazdy Jarosław-Wiedeń', 'Regularne kursy z rezerwacją miejsc online i podglądem dostępnych terminów w kalendarzu.', 'Zarezerwuj miejsce', '/booking'],
    ['03', 'Transport lawetą', 'Przewóz samochodów i motocykli na trasie Polska-Austria, także przy okazji regularnych wyjazdów.', 'Zamów wycenę', '/tow']
  ];

  const trustBadges = [
    ['Przejazdy', '/booking'],
    ['Wynajem busów', '/rental'],
    ['Transport lawetą', '/tow'],
    ['Kontakt', '/contact']
  ];
  const trustItems = [
    ['Regularne kursy Jarosław-Wiedeń', 'Stałe kierunki i przejrzyste terminy w kalendarzu.'],
    ['Komfortowe busy', 'Pojazdy przygotowane pod trasy rodzinne, firmowe i międzynarodowe.'],
    ['Jasne terminy i dostępność', 'Widzisz dostępne dni oraz wolne miejsca przed wysłaniem rezerwacji.'],
    ['Kontakt bez pośredników', 'Zapytanie trafia bezpośrednio do firmy, bez zbędnych kroków.']
  ];

  return (
    <div className="page active">
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1>Transport dla ludzi, grup i pojazdów na trasie Polska-Austria</h1>
          <p>Wynajem busów w okolicach Rzeszowa i Jarosławia, regularne przejazdy Jarosław-Wiedeń oraz transport lawetą na tej samej trasie.</p>
          <div className="trust-badges" aria-label="Najważniejsze usługi">
            {trustBadges.map(([badge, page]) => <button className="trust-badge" key={badge} onClick={() => showPage(page)} type="button">{badge}</button>)}
          </div>
          <div className="hero-actions">
            <button className="hero-btn primary" onClick={() => showPage('/booking')} type="button">Zarezerwuj przejazd</button>
            <button className="hero-btn secondary" onClick={() => showPage('/rental')} type="button">Sprawdź dostępność busa</button>
          </div>
          <div className="hero-contact">
            Kontakt bezpośredni: <a href={contactPhoneHref}>{contactPhone}</a><a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            {!currentUser ? <button onClick={() => showPage('/auth')} type="button">Logowanie klienta</button> : null}
          </div>
        </div>
      </section>
      <section className="trust-strip" aria-label="Zaufanie i standard obsługi">
        <div className="trust-strip-inner">
          {trustItems.map(([title, text]) => (
            <div className="trust-item" key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </div>
          ))}
        </div>
      </section>
      <section className="section">
        <div className="service-grid">
          {services.map(([number, title, text, action, page]) => (
            <article className="service-card" key={title}>
              <div className="service-body">
                <div className="service-mark">{number}</div>
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
