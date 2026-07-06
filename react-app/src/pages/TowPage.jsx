import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';

export function TowPage({ towMsg, submitTowRequest, towSubmitting, currentUser, contactPhone, contactPhoneHref }) {
  return (
    <div className="page active">
      <Hero title="Transport lawetą Polska-Austria" text="Przewóz samochodów, motocykli i pojazdów niesprawnych na trasie Jarosław-Wiedeń oraz w miejscowościach po drodze." />
      <section className="section">
        <div className="split-layout">
          <div>
            <Card title="Trasa lawety"><iframe className="map-frame" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src="https://www.google.com/maps?q=Jaros%C5%82aw%20Poland%20to%20Vienna%20Austria&output=embed"></iframe></Card>
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
                <button className="btn-primary" type="submit" disabled={towSubmitting}>{towSubmitting ? 'Zapisuję zapytanie...' : 'Przygotuj zapytanie'}</button>
              </form>
            </Card>
          </aside>
        </div>
      </section>
    </div>
  );
}
