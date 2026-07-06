import { Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';

export function ContactPage({ contactEmail, contactPhone, contactPhoneHref }) {
  const serviceLinks = [
    ['/rental', 'Wynajem busa', 'Wybierz pojazd i termin w kalendarzu dostępności.'],
    ['/booking', 'Przejazdy', 'Zarezerwuj miejsce na trasie Jarosław-Wiedeń.'],
    ['/tow', 'Laweta', 'Przygotuj zapytanie o transport pojazdu.']
  ];

  return (
    <div className="page active">
      <div className="hero"><h1>Kontakt</h1><p>Szybki kontakt w sprawie przejazdu, wynajmu busa, lawety albo transportu pojazdu.</p></div>
      <section className="section seo-section">
        <div className="seo-panel">
          <h2>Kontakt w sprawie transportu z Jarosławia</h2>
          <p>Zadzwoń pod numer <a href={contactPhoneHref}>{contactPhone}</a> albo napisz na <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Przyjmujemy zapytania o przejazdy Jarosław - Wiedeń, wynajem busa, lawetę oraz transport wybranych towarów.</p>
          <p>Obsługujemy klientów z Jarosławia i okolic oraz zapytania z Podkarpacia. W sprawie tras indywidualnych najlepiej skontaktować się telefonicznie i ustalić szczegóły.</p>
        </div>
      </section>
      <section className="section contact-grid">
        <Card>
          <div className="eyebrow">Kontakt bezpośredni</div>
          <strong>{contactPhone}</strong>
          <p className="form-help"><a href={`mailto:${contactEmail}`}>{contactEmail}</a></p>
          <div className="contact-actions"><a className="btn-primary" href={contactPhoneHref}>Zadzwoń</a><a className="btn-outline" href={`mailto:${contactEmail}`}>Napisz email</a></div>
        </Card>
        {serviceLinks.map(([to, title, text]) => (
          <Link className="card contact-service-card" key={to} to={to}>
            <div className="eyebrow">{title}</div>
            <strong>{text}</strong>
            <span className="contact-service-arrow" aria-hidden="true">›</span>
          </Link>
        ))}
      </section>
    </div>
  );
}
