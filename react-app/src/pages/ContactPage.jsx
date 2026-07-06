import { Card } from '../components/Card.jsx';

export function ContactPage({ contactEmail, contactPhone, contactPhoneHref }) {
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
        <Card><div className="eyebrow">Wynajem busa</div><strong>Wybierz pojazd i termin w kalendarzu dostępności.</strong></Card>
        <Card><div className="eyebrow">Przejazdy</div><strong>Zarezerwuj miejsce na trasie Jarosław-Wiedeń.</strong></Card>
        <Card><div className="eyebrow">Laweta</div><strong>Przygotuj zapytanie o transport pojazdu.</strong></Card>
      </section>
    </div>
  );
}
