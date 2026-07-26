import React from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../components/Card.jsx';
import { Hero } from '../components/Hero.jsx';
import { Message } from '../components/Message.jsx';
import { TurnstileWidget } from '../components/TurnstileWidget.jsx';
import { TOW_VEHICLES } from '../data/towVehicles.js';

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
            <section className="tow-fleet-panel" aria-labelledby="tow-fleet-title">
              <h3 id="tow-fleet-title">Dostępne lawety</h3>
              <p>Dobieramy lawetę do pojazdu, trasy i warunków odbioru. Poniższe opisy pomagają szybko określić, jaki typ transportu będzie potrzebny.</p>
              <div className="tow-fleet-grid">
                {TOW_VEHICLES.map((vehicle) => (
                  <article className="tow-vehicle-card" key={vehicle.name}>
                    <TowVehiclePhotos vehicle={vehicle} />
                    <div className="tow-vehicle-content">
                      <h4>{vehicle.name}</h4>
                      <p>{vehicle.description}</p>
                      <div className="tow-vehicle-meta">
                        {vehicle.parameters.map((parameter) => <span className="pill" key={parameter}>{parameter}</span>)}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
            <Card title="Co można zamówić"><p className="form-help">Realizujemy transport pojazdów, maszyn i wybranych towarów. Opisz ładunek w formularzu, a potwierdzimy możliwość transportu.</p><ul className="mini-list"><li>przewóz auta z Polski do Austrii albo z Austrii do Polski</li><li>transport pojazdu niesprawnego po awarii lub kolizji</li><li>odbiór pojazdu z adresu, parkingu, warsztatu albo komisu</li><li>dostarczenie pod wskazany adres na trasie przejazdu</li></ul></Card>
          </div>
          <aside>
            <Card title="Szybka wycena lawety">
              <p className="form-help">Podaj dane pojazdu i miejsca odbioru. Formularz przygotuje zapytanie, które możesz od razu wysłać do firmy.</p>
              <p className="form-help">Kontakt telefoniczny: <a href={contactPhoneHref}>{contactPhone}</a>.</p>
              <Message message={towMsg} />
              <form onSubmit={submitTowRequest}>
                <div className="tow-form-grid"><div className="fg"><label>Imię i nazwisko</label><input name="name" autoComplete="name" /></div><div className="fg"><label>Telefon</label><input name="phone" type="tel" placeholder="+48 000 000 000" autoComplete="tel" /></div><div className="fg"><label>Email</label><input name="email" type="email" defaultValue={currentUser?.email || ''} autoComplete="email" /></div><div className="fg"><label>Pojazd / ładunek</label><input name="vehicle_info" placeholder="np. VW Passat albo maszyna rolnicza" /></div></div>
                <div className="fg"><label>Skąd odebrać</label><input name="from" placeholder="Adres lub miejscowość odbioru" /></div>
                <div className="fg"><label>Dokąd zawieźć</label><input name="to" placeholder="Adres lub miejscowość dostawy" /></div>
                <div className="fg2"><div className="fg"><label>Preferowany termin</label><input type="date" name="date" /></div><div className="fg"><label>Czy pojazd odpala</label><select name="vehicle_runs"><option value="">Nie wiem / nie dotyczy</option><option>Tak</option><option>Nie</option><option>Nie wiem</option></select></div></div>
                <div className="fg"><label>Czy pojazd ma koła</label><select name="vehicle_has_wheels"><option value="">Nie wiem / nie dotyczy</option><option>Tak</option><option>Nie</option><option>Nie wiem</option></select></div>
                <div className="fg"><label>Dodatkowa wiadomość</label><textarea name="notes" rows="3" placeholder="Stan, utrudniony dojazd, godziny albo inne szczegóły"></textarea></div>
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

function TowVehiclePhotos({ vehicle }) {
  const photos = vehicle.photos || [];
  const [activePhotoIndex, setActivePhotoIndex] = React.useState(0);
  const activePhoto = photos[activePhotoIndex] || photos[0];

  if (!activePhoto) return null;

  return (
    <div className="tow-vehicle-photos">
      <div className="tow-vehicle-photo-main">
        <img src={activePhoto.src} alt={activePhoto.alt} loading="lazy" decoding="async" />
        <span>{activePhotoIndex + 1} / {photos.length}</span>
      </div>
      {photos.length > 1 ? (
        <div className="tow-vehicle-thumbs" aria-label={`Zdjęcia: ${vehicle.name}`}>
          {photos.map((photo, index) => (
            <button className={activePhotoIndex === index ? 'active' : ''} key={`${photo.src}-${index}`} onClick={() => setActivePhotoIndex(index)} type="button" aria-label={`Pokaż zdjęcie ${index + 1}: ${photo.label || photo.alt}`} aria-current={activePhotoIndex === index ? 'true' : undefined}>
              <img src={photo.src} alt="" loading="lazy" decoding="async" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
