# Dokumentacja Techniczna Do Audytu Produkcyjnego

Stan dokumentacji: aktualizacja po migracji `202606260001_secure_reservations_mvp.sql` oraz po aktualnym stanie repozytorium z migracjami `202606280001_trip_prices_manual_payments.sql` i `202606280002_offer_requests_notifications.sql`. Ten etap dotyczy tylko dokumentacji; kod aplikacji nie byl zmieniany. `npm run build` przechodzil poprawnie przy ostatniej weryfikacji. Poprzedni `npm audit` wykazal 2 podatnosci w zaleznosciach deweloperskich zwiazanych z `vite/esbuild`.

Wazne rozroznienie:
- Secure reservations sa wdrozone w kodzie i migracjach, ale wymagaja testow produkcyjnych.
- Stare RPC `create_reservation_atomic` zostalo usuniete przez migracje secure reservations i frontend nie powinien go uzywac.
- W repo nie znaleziono osobnego RPC `expire_requested_reservations`.
- W repo nie znaleziono migracji rozszerzajacej `profiles.role` o `owner`, `tech_admin`, `operator` ani pol `is_blocked`, `blocked_reason`, `blocked_at`. Aktualny kod RLS nadal traktuje admina przez `public.is_admin()` sprawdzajace `profiles.role = 'admin'`.

## 1. Architektura Projektu

Aplikacja to statyczny frontend React/Vite hostowany jako Static Site na Renderze. Nie ma osobnego backendu aplikacyjnego, API ani Edge Functions. Backendowa role pelni Supabase: Auth, Postgres, RLS, widok `trips_with_seats`, funkcje RPC oraz tabele operacyjne.

Frontend:
- React 18, Vite 5, React Router.
- Glowna logika aplikacji znajduje sie w `react-app/src/App.jsx`.
- Style globalne: `react-app/src/styles.css`.
- Brak frameworka UI.

Backend / Supabase:
- Klient Supabase: `react-app/src/lib/supabase.js`.
- Migracje SQL: `supabase/migrations/`.
- Tabele podstawowe: `profiles`, `trips`, `reservations`, `bus_availability`.
- Tabele po nowszych migracjach: `reservation_audit_log`, `trip_prices`, `payments`, `rental_requests`, `tow_requests`, `notification_events`.
- Widok: `trips_with_seats`.
- Aktywne RPC rezerwacyjne: `create_reservation_request`, `cancel_own_reservation`, `admin_set_reservation_status`.
- Aktywne RPC administracyjne i ofertowe: `admin_set_trip_price`, `admin_set_payment_status`, `create_rental_request`, `create_tow_request`, `admin_update_rental_request`, `admin_update_tow_request`.

Routing:
- `/` strona glowna.
- `/rental` wynajem busow.
- `/booking` rezerwacje przejazdow.
- `/tow` transport laweta.
- `/contact` kontakt.
- `/auth` logowanie/rejestracja/reset.
- `/my-reservations` rezerwacje zalogowanego uzytkownika.
- `/admin` panel administratora.
- `/verify-email`, `/reset-password` trasy techniczne Supabase Auth.

Panel administratora:
- Chroniony w UI przez `react-app/src/components/ProtectedAdminRoute.jsx`.
- Dostep zalezy od profilu uzytkownika i roli admina.
- Aktualna funkcja `public.is_admin()` sprawdza `profiles.role = 'admin'`.
- Panel ma zakladki: terminy kursow, dostepnosc busow, rezerwacje, ceny, zapytania.
- Operacje admina sa dodatkowo chronione przez RLS i RPC typu `security definer`.

Integracje zewnetrzne:
- Supabase Auth/Postgres/RLS/RPC.
- Render Static Site.
- Google Maps: linki tras i iframe na stronie lawety.
- Zewnetrzne URL-e zdjec pojazdow w `react-app/src/data/vehicles.js`.
- `VITE_CONTACT_EMAIL` pozostaje publicznym adresem kontaktowym w UI, ale formularze rental/tow w aktualnym repo zapisuja zapytania do Supabase przez RPC.

## 2. Struktura Katalogow I Najwazniejsze Pliki

```text
STRONA-TATY-DARII/
  render.yaml
  DOKUMENTACJA_TECHNICZNA_AUDYT.md
  supabase/migrations/
  react-app/
    .env.example
    package.json
    vite.config.js
    index.html
    public/
    src/
      App.jsx
      main.jsx
      styles.css
      components/
      data/
      hooks/
      lib/
      pages/
```

Najwazniejsze pliki:
- `render.yaml`: konfiguracja Rendera, `rootDir: react-app`, build, publish directory, rewrite SPA.
- `react-app/package.json`: zaleznosci, Node `>=18`, skrypty `dev`, `build`, `preview`.
- `react-app/index.html`: podstawowe SEO, Open Graph, favicon.
- `react-app/src/main.jsx`: wejscie React, `BrowserRouter`, `ErrorBoundary`.
- `react-app/src/App.jsx`: routing, stan aplikacji, operacje Supabase, logika formularzy.
- `react-app/src/lib/supabase.js`: konfiguracja env i klient Supabase.
- `react-app/src/hooks/useAuth.js`: sesja, profil uzytkownika, rola.
- `react-app/src/pages/AdminPage.jsx`: widoki admina, statusy rezerwacji, ceny, platnosci i zapytania.
- `react-app/src/pages/BookingPage.jsx`: kalendarz kursow, cena miejsca, formularz zgloszenia rezerwacji.
- `react-app/src/pages/RentalPage.jsx`: formularz zapytania o wynajem busa.
- `react-app/src/pages/TowPage.jsx`: formularz zapytania o lawete.
- `react-app/src/data/routeDetails.js`: trasy, przystanki, linki Google Maps.
- `react-app/src/data/vehicles.js`: dane busow i zdjecia.
- `react-app/public/verify-email.html`, `react-app/public/reset-password.html`: mostki redirectow Supabase Auth.

Konfiguracja srodowiskowa:
- Lokalny przyklad: `react-app/.env.example`.
- Faktyczny `.env.local` powinien byc w `react-app/.env.local`.
- Pliki `.env*` sa ignorowane przez Git.

Polaczenia z Supabase:
- Utworzenie klienta: `react-app/src/lib/supabase.js`.
- Odczyty i zapisy: glownie `react-app/src/App.jsx`.
- Auth: `react-app/src/hooks/useAuth.js`, `react-app/src/App.jsx`.

## 3. Zmienne Srodowiskowe

Wymagane `VITE_*`:
- `VITE_SUPABASE_URL`: publiczny URL projektu Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: publiczny klucz Supabase do klienta frontendowego.
- `VITE_PUBLIC_APP_ORIGIN`: publiczny origin aplikacji uzywany do redirectow Auth, np. `https://domena.pl`.
- `VITE_CONTACT_EMAIL`: publiczny adres kontaktowy uzywany w UI.

Wazne: w Vite kazda zmienna `VITE_*` trafia do bundla frontendowego, wiec jest publiczna. Nie wolno umieszczac w frontendzie:
- `service_role`,
- `DATABASE_URL`,
- hasel SMTP,
- sekretow OAuth,
- prywatnych tokenow Render/Supabase,
- kluczy API niewlasciwych do ekspozycji w przegladarce.

## 4. Supabase

Tabele:
- `profiles`: `id`, `role`, `phone`, `created_at`, `updated_at`; relacja 1:1 do `auth.users`. W aktualnych migracjach check pozwala na role `user` i `admin`.
- `trips`: `id`, `route`, `date`, `cancelled`, `max_seats`, timestamps; unikalne `(route, date)`.
- `reservations`: `id`, `trip_id`, `user_id`, dane pasazera, `seats`, `notes`, `status`, timestamps oraz pola procesu: `expires_at`, `cancelled_at`, `cancelled_by`, `cancelled_less_than_24h_before_trip`, `terms_accepted_at`, `terms_version`, `price_per_seat_snapshot`, `total_price_snapshot`, `currency`.
- `reservation_audit_log`: zapis zmian statusow rezerwacji wykonywanych przez admina przez RPC; pola `actor_id`, `action_type`, `reservation_id`, `previous_status`, `new_status`, `created_at`.
- `bus_availability`: `bus_id`, `date`, `available`, timestamps; PK `(bus_id, date)`.
- `trip_prices`: cena miejsca per trasa (`JW`, `WJ`), waluta, admin aktualizujacy, timestamps.
- `payments`: reczna ewidencja platnosci powiazana z rezerwacja, kwota, waluta, metoda, status, admin potwierdzajacy, notatka.
- `rental_requests`: zapytania o wynajem busa zapisywane w bazie.
- `tow_requests`: zapytania o transport laweta zapisywane w bazie.
- `notification_events`: kolejka zdarzen powiadomien, np. nowe zgloszenie rezerwacji, rental/tow request albo anulowanie. Repo nie zawiera jeszcze mechanizmu wysylki tych powiadomien.

Relacje:
- `auth.users -> profiles`: 1:1.
- `trips -> reservations`: 1:N.
- `auth.users -> reservations`: 1:N.
- `reservations -> payments`: 1:N.
- `bus_availability` nie ma relacji do osobnej tabeli pojazdow; `bus_id` jest ograniczone checkiem do `bus9`/`bus8`.

Statusy rezerwacji:
- `requested`: nowe zgloszenie od klienta, nie blokuje miejsca.
- `accepted`, `payment_pending`, `paid`, `confirmed`: statusy blokujace miejsce.
- `rejected`, `cancelled_user`, `cancelled_admin`, `expired`, `no_show`: statusy nieblokujace miejsca.

Liczenie miejsc:
- Funkcja `reservation_blocks_seat(status)` zwraca `true` tylko dla `accepted`, `payment_pending`, `paid`, `confirmed`.
- Widok `trips_with_seats` liczy `used_seats` i `free_seats` tylko na podstawie statusow blokujacych miejsce.
- `requested` nie zmniejsza liczby wolnych miejsc w kalendarzu.

RLS:
- `profiles`: uzytkownik widzi swoj profil; admin widzi i aktualizuje profile.
- `trips`: publiczny odczyt dla `anon` i `authenticated`; insert/update tylko admin.
- `reservations`: brak bezposredniego dostepu dla `anon`; `authenticated` ma SELECT dla wlasnych rezerwacji, admin SELECT wszystkich. Stare polityki direct insert/update zostaly usuniete przez `202606260001_secure_reservations_mvp.sql`.
- `reservation_audit_log`: SELECT tylko dla admina.
- `bus_availability`: publiczny odczyt; insert/update tylko admin.
- `trip_prices`: publiczny SELECT; zapis przez RPC `admin_set_trip_price`.
- `payments`: SELECT/INSERT/UPDATE tylko dla admina.
- `rental_requests` i `tow_requests`: admin SELECT/UPDATE; tworzenie zapytan odbywa sie przez publiczne RPC `create_rental_request` i `create_tow_request`.
- `notification_events`: SELECT tylko dla admina.

RPC rezerwacji:
- `create_reservation_request(...)`: dostepne tylko dla `authenticated`; wymaga zalogowanego uzytkownika, potwierdzonego emaila, jednego miejsca, akceptacji regulaminu i zasad anulowania. Tworzy rekord `requested`, ustawia `expires_at` oraz snapshot ceny w nowszych migracjach.
- `cancel_own_reservation(p_reservation_id)`: dostepne tylko dla `authenticated`; anuluje wlasna rezerwacje przez status `cancelled_user`, zapisuje `cancelled_at`, `cancelled_by` i flage anulowania mniej niz 24h przed kursem.
- `admin_set_reservation_status(p_reservation_id, p_status)`: dostepne dla admina; zmienia status na `accepted`, `payment_pending`, `confirmed`, `rejected`, `cancelled_admin`, `expired`. W aktualnym UI admin ma akcje `accepted`, `payment_pending`, `confirmed`, `rejected`, `cancelled_admin`. RPC sprawdza wolne miejsca przy przejsciu na status blokujacy i zapisuje `reservation_audit_log`.
- `create_reservation_atomic(...)`: stare RPC usuniete przez migracje secure reservations; frontend nie powinien go uzywac.
- `expire_requested_reservations`: nie znaleziono w aktualnym repo. Aktualne RPC `create_reservation_request` wygasza stare `requested` danego uzytkownika przy kolejnym zgloszeniu; pelne cykliczne wygaszanie wymaga osobnej funkcji lub joba.

RPC cen, platnosci i zapytan:
- `admin_set_trip_price(...)`: admin ustawia cene miejsca i walute dla trasy.
- `admin_set_payment_status(...)`: admin ustawia status, metode, kwote i notatke platnosci dla rezerwacji.
- `create_rental_request(...)`: zapisuje zapytanie o wynajem busa; dostepne dla `anon` i `authenticated`.
- `create_tow_request(...)`: zapisuje zapytanie o lawete; dostepne dla `anon` i `authenticated`.
- `admin_update_rental_request(...)`, `admin_update_tow_request(...)`: admin aktualizuje statusy i notatki zapytan.

Auth:
- Email/password, rejestracja, login, reset hasla, potwierdzenie emaila.
- Profil tworzony triggerem `handle_new_user()`.
- Rezerwacje przejazdow wymagaja zalogowania i potwierdzonego emaila.
- Pierwszego admina trzeba nadac recznie z poziomu Supabase SQL/Service Role.
- Role `owner`, `tech_admin`, `operator` i blokada profilu nie sa widoczne w aktualnych migracjach repo; jezeli sa wymagane biznesowo, trzeba dodac migracje i zaktualizowac `public.is_admin()` lub stworzyc osobne funkcje uprawnien.

Storage/buckety:
- Brak uzycia Supabase Storage.
- Brak bucketow i polityk storage w migracjach.
- Brak uploadu zdjec w kodzie.

## 5. Funkcje Systemu

Publiczne:
- Strona glowna z uslugami i CTA.
- Wynajem busow: wybor pojazdu, kalendarz dostepnosci, zapis zapytania do `rental_requests`.
- Rezerwacja przejazdu Jaroslaw-Wieden / Wieden-Jaroslaw: anonim moze ogladac trasy, ceny i terminy, ale nie moze wyslac zgloszenia.
- Transport laweta: formularz wyceny zapisuje zapytanie do `tow_requests`.
- Rejestracja, logowanie, reset hasla, weryfikacja emaila.
- Widok "Moje rezerwacje" dla zalogowanych.
- Anulowanie wlasnej rezerwacji przez RPC `cancel_own_reservation`.

Rezerwacje przejazdow:
- Frontend uzywa `create_reservation_request`.
- Wymagane sa: zalogowany uzytkownik, potwierdzony email, jeden wybrany termin, jedno miejsce, poprawne dane pasazera, rozne przystanki wsiadania/wysiadania i checkbox regulaminu.
- Nowe zgloszenie dostaje status `requested`.
- `requested` nie blokuje miejsca.
- Admin w panelu obsluguje zgloszenie, ustawiajac status przez RPC.
- Limity w RPC: maksymalnie jedno aktywne zgloszenie/rezerwacja uzytkownika na jeden kurs oraz maksymalnie 4 aktywne `requested` dla uzytkownika.

Admin:
- Generowanie kursow miesiecznych: niedziele `JW`, piatki `WJ`.
- Dodawanie/odwolywanie/przywracanie kursow.
- Zarzadzanie dostepnoscia busow w kalendarzu.
- Podglad rezerwacji z podzialem na nowe zgloszenia i pozostale rezerwacje.
- Zmiana statusow rezerwacji przez `admin_set_reservation_status`.
- Ustawianie cen tras przez `admin_set_trip_price`.
- Reczna ewidencja platnosci przez `admin_set_payment_status`.
- Podglad i aktualizacja zapytan rental/tow.
- Brak edycji tresci marketingowych z panelu.
- Brak uploadu i zarzadzania zdjeciami.

Formularze:
- Booking zapisuje zgloszenie do Supabase przez RPC.
- Rental/tow zapisuja leady do Supabase przez RPC.
- Contact nie ma osobnego formularza wysylkowego.

## 6. Scenariusze Uzytkownikow

Anonimowy odwiedzajacy:
1. Wchodzi na strone glowna.
2. Przeglada oferte, trase, ceny, dostepne kursy, wynajem busow i lawete.
3. Moze wyslac zapytanie rental/tow.
4. Nie moze wyslac zgloszenia rezerwacji przejazdu bez logowania.

Klient rezerwujacy przejazd:
1. Rejestruje sie albo loguje.
2. Potwierdza adres email.
3. Wybiera trase, termin, przystanek wsiadania i wysiadania.
4. Widzi cene miejsca i liczbe wolnych miejsc.
5. Wypelnia dane pasazera, akceptuje regulamin i zasady anulowania.
6. Frontend wywoluje `create_reservation_request`.
7. System tworzy `requested`, ktory trafia do panelu admina i nie blokuje miejsca.
8. Po decyzji admina status moze przejsc na status blokujacy miejsce (`accepted`, `payment_pending`, `confirmed`) albo nieblokujacy (`rejected`, `cancelled_admin`, `expired`).

Klient anulujacy rezerwacje:
1. Loguje sie.
2. Wchodzi w `/my-reservations`.
3. Uruchamia anulowanie.
4. Frontend wywoluje `cancel_own_reservation`.
5. System ustawia `cancelled_user` i zapisuje dane anulowania.

Administrator:
1. Loguje sie przez `/auth`.
2. `useAuth` pobiera `profiles.role`.
3. `/admin` renderuje sie dla profilu admina.
4. Admin generuje kursy, odwoluje je, zarzadza dostepnoscia busow.
5. Admin widzi `requested` jako nowe zgloszenia.
6. Admin ustawia status przez RPC: `accepted`, `payment_pending`, `confirmed`, `rejected`, `cancelled_admin`.
7. Zmiany statusu rezerwacji zapisuja sie w `reservation_audit_log`.
8. Admin ustawia ceny tras, recznie oznacza platnosci i obsluguje zapytania rental/tow.

## 7. Ryzyka Przed Produkcja

Rozwiazane przez secure reservations:
- Stary model bezposredniego insert/update do `reservations` przez zwyklego uzytkownika zostal zamkniety w RLS.
- Anonimowe tworzenie rezerwacji przejazdu przez stare RPC zostalo odciete.
- `requested` nie blokuje juz miejsca w `trips_with_seats`.
- Rezerwacja przejazdu wymaga zalogowanego uzytkownika i potwierdzonego emaila.
- Tworzenie i anulowanie rezerwacji odbywa sie przez kontrolowane RPC.

Krytyczne / wysokie nadal otwarte:
- Brak CAPTCHA / Turnstile na publicznych formularzach i RPC zapytan rental/tow.
- Brak rate limitingu po stronie Supabase/Edge/API dla formularzy i RPC.
- Brak mechanizmu wysylki powiadomien admina; `notification_events` jest kolejka zdarzen, ale bez sendera.
- Brak backupow/retencji opisanych w repo.
- Brak pelnych testow produkcyjnych secure reservations, cen, platnosci i zapytan.
- `expire_requested_reservations` nie istnieje w repo; automatyczne wygaszanie `requested` wymaga doprecyzowania.

Srednie:
- Role `owner`, `tech_admin`, `operator` i blokada uzytkownika nie sa obecne w migracjach repo, mimo ze moga byc wymagane operacyjnie.
- Twardo wpisany telefon `+48 123 456 789` w nawigacji wymaga zastapienia realnym numerem.
- SEO/OG/sitemap/robots wskazuja domene `strona-taty-darii.onrender.com`; po custom domain trzeba zmienic.
- Jedno globalne `title`/`description` dla SPA.
- Brak structured data dla lokalnej firmy.
- Zewnetrzne hotlinkowane zdjecia pojazdow moga zniknac, ladowac sie wolno albo miec ryzyka licencyjne.
- Brak centralnego logowania bledow.
- Zaleznosci wymagaja aktualizacji po `npm audit`.
- Brak regulaminu i polityki prywatnosci jako formalnie przygotowanych dokumentow produkcyjnych.

## 8. Uruchomienie Lokalne

Wymagania:
- Node.js `>=18`.
- npm.
- Dostep do projektu Supabase.
- Opcjonalnie Supabase CLI do migracji.

Instalacja:
```bash
cd react-app
npm install
cp .env.example .env.local
```

`.env.local`:
```bash
VITE_SUPABASE_URL=https://...supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=...
VITE_PUBLIC_APP_ORIGIN=http://localhost:5173
VITE_CONTACT_EMAIL=kontakt@example.com
```

Dev:
```bash
npm run dev
```

Build produkcyjny:
```bash
npm run build
```

Preview:
```bash
npm run preview
```

Migracje Supabase:
```bash
supabase link --project-ref TWOJ_PROJECT_REF
supabase db push
```

Kolejnosc istotnych migracji:
- `202606040001_schema.sql`
- `202606040002_trips_with_seats.sql`
- `202606040003_rls.sql`
- `202606040004_create_reservation_atomic.sql`
- `202606260001_secure_reservations_mvp.sql`
- `202606280001_trip_prices_manual_payments.sql`
- `202606280002_offer_requests_notifications.sql`

## 9. Deploy Na Render

Konfiguracja z repo:
- Root Directory: `react-app`
- Build Command: `npm install && npm run build`
- Publish Directory: `dist`
- Rewrite SPA: `/* -> /index.html`

Te wartosci sa juz w `render.yaml`.

Environment Variables na Renderze:
```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PUBLIC_APP_ORIGIN=
VITE_CONTACT_EMAIL=
```

Po zmianie envow trzeba przebudowac aplikacje, bo Vite wstrzykuje `VITE_*` na etapie builda.

Custom Domain i SSL:
- Dodac domene w Render Dashboard.
- Ustawic DNS wedlug instrukcji Rendera dla domeny/root/subdomeny.
- Po weryfikacji Render wystawia SSL automatycznie.
- Zaktualizowac `VITE_PUBLIC_APP_ORIGIN`, Supabase Auth Site URL, Additional Redirect URLs, `sitemap.xml`, `robots.txt`, `og:url`.

Zrodla dla Render:
- https://render.com/docs/static-sites
- https://render.com/docs/custom-domains

## 10. Production Readiness Checklist

Gotowe w kodzie/repo:
- React/Vite build dziala przy ostatniej weryfikacji.
- Render static config istnieje.
- SPA rewrite istnieje.
- Supabase envy sa wydzielone.
- Migracja secure reservations jest w repo.
- RLS `reservations` zamyka direct insert/update dla zwyklych uzytkownikow.
- Frontend uzywa `create_reservation_request`, `cancel_own_reservation`, `admin_set_reservation_status`.
- Status poczatkowy rezerwacji to `requested`.
- `requested` nie blokuje miejsca.
- `reservation_audit_log` istnieje.
- Panel admina pokazuje nowe zgloszenia i pozwala zmieniac statusy przez RPC.
- Ceny przejazdow i snapshot ceny rezerwacji sa dodane w repo.
- Reczna ewidencja platnosci jest dodana w repo.
- Zapytania rental/tow sa zapisywane do bazy w aktualnym repo.
- `notification_events` zapisuje zdarzenia, ale nie wysyla jeszcze powiadomien.

Do potwierdzenia testami produkcyjnymi:
- Produkcja nie uzywa juz `create_reservation_atomic`.
- Anonim nie moze rezerwowac przejazdu.
- Uzytkownik bez potwierdzonego emaila nie moze rezerwowac przejazdu.
- Potwierdzony uzytkownik tworzy `requested`.
- `requested` nie zmniejsza wolnych miejsc.
- Admin zmienia status przez `admin_set_reservation_status`.
- Zmiana statusu blokujacego respektuje dostepne miejsca.
- Anulowanie dziala przez `cancel_own_reservation`.
- `reservation_audit_log` zapisuje akcje admina.
- Ceny sa widoczne w booking i zapisywane przez admina.
- Platnosci zapisuje admin przez RPC.
- Rental/tow requests zapisuja sie w bazie i sa widoczne w panelu admina.
- Supabase Auth redirect URLs sa poprawne.
- Pierwszy admin istnieje w `profiles`.
- Migracje sa faktycznie wdrozone na produkcyjnej bazie.

Nadal do zrobienia:
- CAPTCHA / Turnstile.
- Rate limiting.
- Mechanizm wysylki powiadomien admina na podstawie `notification_events`.
- Custom domain.
- SEO: sitemap, robots, OG, structured data, tytuly/opisy.
- Realny numer telefonu i finalny email.
- Regulamin i polityka prywatnosci.
- Backupy Supabase.
- Aktualizacja zaleznosci po `npm audit`.
- Docelowe zdjecia/storage zamiast hotlinkowanych URL-i.
- Decyzja/migracja dla rol `owner`, `tech_admin`, `operator` i blokady uzytkownika, jesli to nadal wymaganie.
- Osobne cykliczne wygaszanie `requested`, jesli ma dzialac niezaleznie od kolejnego zgloszenia uzytkownika.

## 11. Dane Potrzebne Dla ChatGPT Do Przygotowania Listy Testow Systemu

Projekt: React 18 + Vite 5 + Supabase + Render Static Site.

Trasy: `/`, `/rental`, `/booking`, `/tow`, `/contact`, `/auth`, `/my-reservations`, `/admin`, `/verify-email`, `/reset-password`.

Supabase:
- Tabele: `profiles`, `trips`, `reservations`, `reservation_audit_log`, `bus_availability`, `trip_prices`, `payments`, `rental_requests`, `tow_requests`, `notification_events`.
- Widok: `trips_with_seats`.
- Funkcja miejsc: `reservation_blocks_seat`.
- RPC rezerwacji: `create_reservation_request`, `cancel_own_reservation`, `admin_set_reservation_status`.
- RPC cen/platnosci: `admin_set_trip_price`, `admin_set_payment_status`.
- RPC zapytan: `create_rental_request`, `create_tow_request`, `admin_update_rental_request`, `admin_update_tow_request`.
- Stare RPC `create_reservation_atomic` nie powinno istniec po migracji secure reservations ani byc uzywane przez frontend.

Auth:
- Email/password, rejestracja, potwierdzenie emaila, reset hasla.
- Aktualne role w repo: `user`, `admin`.
- Admin w UI i RPC zalezy od `public.is_admin()`.
- Rezerwacja przejazdu wymaga `authenticated` i potwierdzonego emaila.

Statusy rezerwacji:
- `requested`: nowy request, nie blokuje miejsca.
- Blokuja miejsce: `accepted`, `payment_pending`, `paid`, `confirmed`.
- Nie blokuja miejsca: `rejected`, `cancelled_user`, `cancelled_admin`, `expired`, `no_show`.

RLS aktualny:
- `reservations`: brak direct insert/update/delete dla zwyklych uzytkownikow; `authenticated` SELECT swoich, admin SELECT wszystkich; zmiany przez RPC.
- `trips`, `bus_availability`: publiczny odczyt, zapis admin.
- `trip_prices`: publiczny odczyt, zapis przez admin RPC.
- `payments`, `reservation_audit_log`, `notification_events`: admin.
- `rental_requests`, `tow_requests`: tworzenie przez RPC dla anon/auth, podglad/aktualizacja admin.

Publiczne funkcje do testow:
- Anonim oglada kursy i wolne miejsca.
- Anonim nie moze zarezerwowac przejazdu.
- Zalogowany bez potwierdzonego emaila nie moze zarezerwowac przejazdu.
- Zalogowany z potwierdzonym emailem moze wyslac `requested`.
- Rental/tow zapisuja request do bazy.
- Moje rezerwacje pokazuja rezerwacje zalogowanego uzytkownika.
- Anulowanie wlasnej rezerwacji dziala przez RPC.

Admin do testow:
- Generowanie kursow miesiecznych.
- Dodawanie/odwolywanie/przywracanie kursow.
- Dostepnosc busow.
- Lista rezerwacji z `requested`.
- Zmiana statusow rezerwacji.
- Audit log statusow.
- Ceny tras.
- Reczne platnosci.
- Zapytania rental/tow.

Ryzyka nadal otwarte do uwzglednienia w testach:
- Brak CAPTCHA / Turnstile.
- Brak rate limitingu.
- Brak faktycznej wysylki powiadomien admina.
- Brak backupow opisanych w repo.
- Redirecty Auth i custom domain/SSL.
- SEO/sitemap/robots/OG.
- Brak storage/uploadu zdjec.
- Podatnosci `vite/esbuild` z `npm audit`.
- Brak rol `owner`, `tech_admin`, `operator` i blokady uzytkownika w repo, jezeli nadal sa wymagane.
- Brak osobnego `expire_requested_reservations`.

## 12. Aktualny Status Etapow

- Etap 1/2: secure reservations - wdrozony w kodzie i migracjach, wymaga testow produkcyjnych.
- Etap 3: ceny i reczne platnosci - wdrozone w repo przez `202606280001_trip_prices_manual_payments.sql` i UI admina, wymaga migracji/testow produkcyjnych.
- Etap 4: rental/tow requests - wdrozone w repo przez `202606280002_offer_requests_notifications.sql` i UI admina, wymaga migracji/testow produkcyjnych.
- Etap 5: powiadomienia admina - `notification_events` jest wdrozone jako kolejka zdarzen, ale realna wysylka powiadomien jest do zrobienia.
- Etap 6: testy produkcyjne pelne - do zrobienia.
