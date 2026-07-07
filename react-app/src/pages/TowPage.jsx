import { Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { TurnstileWidget } from '../components/TurnstileWidget.jsx';

export function TowPage({ towMsg, submitTowRequest, towSubmitting, currentUser, contactPhone, contactPhoneHref, onTurnstileVerify, turnstileResetKey }) {
  return (
    <div className="page active">
      <Hero title="Laweta Jarosław i transport pojazdów" text="Przewóz samochodów, motocykli i pojazdów niesprawnych na trasie Jarosław-Wiedeń oraz w miejscowościach po drodze." />
      <section className="section">
        <div className="seo-panel mb">
          <h2>Laweta Jarosław, Podkarpacie i trasy Polska-Austria</h2>
          <p>Laweta Jarosław obejmuje transport pojazdów, transport maszyn oraz transport wybranych towarów po wcześniejszym potwierdzeniu możliwości przewozu. Opisz ładunek w formularzu, podaj miejsce odbioru i dostawy, a wrócimy z potwierdzeniem szczegółów.</p>
          <p>Przyjmujemy zapytania z Jarosławia i okolic oraz z terenu Podkarpacia. Trasy indywidualne, w tym kierunek Wiedeń i Austria, ustalamy osobno.</p>
          <div className="seo-text-actions"><Link className="btn-outline" to="/contact">Kontakt w sprawie lawety</Link></div>
        </div>
        <div className="split-layout">
          <div>
            <Card title="Trasa lawety"><iframe className="map-frame" title="Mapa trasy lawety Jarosław Wiedeń" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Jaros%C5%82aw%20Poland%20to%20Vienna%20Austria&output=embed"></iframe></Card>
            <Card title="Co można zamówić"><p className="form-help">Realizujemy transport pojazdów, maszyn i wybranych towarów. Opisz ładunek w formularzu, a potwierdzimy możliwość transportu.</p><ul className="mini-list"><li>przewóz auta z Polski do Austrii albo z Austrii do Polski</li><li>transport pojazdu niesprawnego po awarii lub kolizji</li><li>odbiór pojazdu z adresu, parkingu, warsztatu albo komisu</li><li>dostarczenie pod wskazany adres na trasie przejazdu</li></ul></Card>
          </div>
          <aside>
            <Card title="Szybka wycena lawety">
              <p className="form-help">Podaj dane pojazdu i miejsca odbioru. Formularz przygotuje zapytanie, które możesz od razu wysłać do firmy.</p>
              <p className="form-help">Kontakt telefoniczny: <a href={contactPhoneHref}>{contactPhone}</a>.</p>
              <Message message={towMsg} />
              <form onSubmit={submitTowRequest}>
                <div className="tow-form-grid"><div className="fg"><label>Imię i nazwisko</label><input name="name" autoComplete="name" /></div><div className="fg"><label>Telefon</label><input name="phone" type="tel" autoComplete="tel" /></div><div className="fg"><label>Email</label><input name="email" type="email" defaultValue={currentUser?.email || ''} autoComplete="email" /></div><div className="fg"><label>Marka i model</label><input name="car" /></div><div className="fg"><label>Stan pojazdu</label><select name="state"><option>Sprawny</option><option>Niesprawny, odpala</option><option>Niesprawny, nie odpala</option><option>Powypadkowy</option></select></div></div>
                <div className="fg"><label>Miejsce odbioru</label><input name="from" /></div>
                <div className="fg"><label>Miejsce dostawy</label><input name="to" /></div>
                <div className="fg2"><div className="fg"><label>Preferowana data</label><input type="date" name="date" /></div><div className="fg"><label>Kierunek</label><select name="direction"><option>{'Polska -> Austria'}</option><option>{'Austria -> Polska'}</option></select></div></div>
                <div className="fg"><label>Dodatkowe informacje</label><textarea name="notes" rows="3"></textarea></div>
                <TurnstileWidget onVerify={onTurnstileVerify} resetKey={turnstileResetKey} />
                <button className="btn-primary" type="submit" disabled={towSubmitting}>{towSubmitting ? 'Zapisuję zapytanie...' : 'Przygotuj zapytanie'}</button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
