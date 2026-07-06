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
      <div className="hero"><h1>Kontakt i zapytania</h1><p>Wybierz usługę na stronie i wyślij zapytanie z kompletem danych do wyceny.</p></div>
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
