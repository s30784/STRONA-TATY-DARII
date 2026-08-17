export function HomePage({ showPage, currentUser, contactEmail, contactPhone, contactPhoneHref }) {
  const services = [
    ['01', 'Wynajem busa', 'Bus dla rodzin, firm, ekip i grup wyjazdowych w okolicach Jarosławia, Przeworska i Rzeszowa, także przy trasach z większym bagażem.', 'Sprawdź dostępność', '/rental'],
    ['02', 'Przejazdy Jarosław-Wiedeń', 'Przewóz osób z Jarosławia, Przemyśla, Przeworska i okolic do Wiednia z rezerwacją miejsc online.', 'Zarezerwuj miejsce', '/booking'],
    ['03', 'Transport lawetą', 'Laweta i transport pojazdów Podkarpacie: przewóz samochodów, motocykli oraz wybranych większych rzeczy po ustaleniu szczegółów.', 'Zamów wycenę', '/tow']
  ];

  const trustBadges = [
    ['Przejazdy', '/booking'],
    ['Wynajem busa', '/rental'],
    ['Transport lawetą', '/tow'],
    ['Kontakt', '/contact']
  ];
  const trustItems = [
    ['Regularne kursy Jarosław-Wiedeń', 'Stałe kierunki i przejrzyste terminy w kalendarzu.'],
    ['Komfortowy bus', 'Pojazd przygotowany pod trasy rodzinne, firmowe i międzynarodowe.'],
    ['Jasne terminy i dostępność', 'Widzisz dostępne dni oraz wolne miejsca przed wysłaniem rezerwacji.'],
    ['Kontakt bez pośredników', 'Zapytanie trafia bezpośrednio do firmy, bez zbędnych kroków.']
  ];

  return (
    <div className="page active">
      <section className="home-hero">
        <div className="home-hero-inner">
          <h1>Transport z Jarosławia i Podkarpacia</h1>
          <p>Przejazdy i transport do Wiednia z Jarosławia, Przemyśla, Przeworska i Podkarpacia, wynajem busa oraz laweta i transport pojazdów.</p>
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
      <section className="section seo-section">
        <div className="seo-panel">
          <h2>Usługi transportowe Jarosław, Podkarpacie i Austria</h2>
          <p>Busy Jarosław obsługuje przejazdy i transport na trasach z Jarosławia, Przemyśla, Przeworska i okolic w kierunku Wiednia. Oprócz przewozu osób oferujemy wynajem busa, wynajem lawety, transport pojazdów oraz wybranych większych rzeczy po indywidualnym ustaleniu szczegółów.</p>
          <div className="seo-copy-grid">
            <article>
              <h3>Przewóz osób Jarosław - Wiedeń</h3>
              <p>Regularne przejazdy busem na trasie Jarosław - Wiedeń i Wiedeń - Jarosław mają widoczne terminy, cenę oraz wolne miejsca w kalendarzu rezerwacji. Przyjmujemy też zapytania z Przemyśla, Przeworska i okolic.</p>
            </article>
            <article>
              <h3>Wynajem busa</h3>
              <p>Wynajem busa sprawdza się przy wyjazdach rodzinnych, firmowych i grupowych, również gdy trasa wymaga miejsca na większy bagaż. Formularz pozwala wybrać termin i wysłać zapytanie o dostępność.</p>
            </article>
            <article>
              <h3>Laweta i transport</h3>
              <p>Przyjmujemy zapytania o transport pojazdów z Jarosławia, Przemyśla i Przeworska. Przewóz samochodów na Podkarpaciu, motocykli oraz wybranych ładunków potwierdzamy po sprawdzeniu możliwości przewozu.</p>
            </article>
            <article>
              <h3>Większe rzeczy</h3>
              <p>Transport większych rzeczy i transport wybranych gabarytów traktujemy jako zapytanie indywidualne: przed przyjęciem zlecenia potwierdzamy wymiary, wagę, trasę i możliwości załadunku.</p>
            </article>
          </div>
        </div>
      </section>
    </div>
  );
}
