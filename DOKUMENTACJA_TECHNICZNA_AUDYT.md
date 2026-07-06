# Dokumentacja Techniczna Do Audytu Produkcyjnego

Stan dokumentacji: aktualizacja po testach produkcyjnych MVP wykonanych 2026-07-05. Zakres MVP obejmuje bezpieczne rezerwacje, ceny, reczna ewidencje platnosci, zapytania rental/tow oraz zapis `notification_events`. Ten etap dotyczy tylko dokumentacji; kod aplikacji nie byl zmieniany. Poprzedni `npm audit` wykazal 2 podatnosci w zaleznosciach deweloperskich zwiazanych z `vite/esbuild`.

Wazne rozroznienie:
- Secure reservations sa wdrozone i potwierdzone testami produkcyjnymi MVP.
- Stare RPC `create_reservation_atomic` zostalo usuniete przez migracje secure reservations i frontend nie powinien go uzywac.
- `notification_events` sa tworzone po rezerwacji, anulowaniu oraz zapytaniach rental/tow, ale realna wysylka powiadomien jest nadal do zrobienia.
- Rzeczy zrobione i przetestowane sa rozdzielone od listy TODO w sekcjach 6, 8 i 11.

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
- Tabele podstawowe: `profiles`, `trips`, `reservations`.
- Tabele operacyjne: `reservation_audit_log`, `trip_prices`, `payments`, `rental_requests`, `rental_calendar_blocks`, `tow_requests`, `notification_events`.
- Widok: `trips_with_seats`.
- Aktywne RPC rezerwacyjne: `create_reservation_request`, `cancel_own_reservation`, `admin_set_reservation_status`.
- Aktywne RPC administracyjne i ofertowe: `admin_set_trip_price`, `admin_set_payment_status`, `get_rental_calendar_blocks`, `rental_is_range_available`, `create_rental_request`, `create_tow_request`, `admin_update_rental_request`, `admin_update_tow_request`.

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
- Panel ma zakladki: terminy kursow, blokady wynajmu, rezerwacje, ceny, zapytania.
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
- `profiles`: `id`, `full_name`, `email`, `phone`, `role`, pola blokady konta, timestamps; relacja 1:1 do `auth.users`. Produkcyjne role: `user`, `admin`, `owner`, `tech_admin`, `operator`.
- `trips`: `id`, `route`, `date`, `cancelled`, `max_seats`, timestamps; unikalne `(route, date)`.
- `reservations`: `id`, `trip_id`, `user_id`, dane pasazera, `seats`, `notes`, `status`, timestamps oraz pola procesu: `expires_at`, `cancelled_at`, `cancelled_by`, `cancelled_less_than_24h_before_trip`, `terms_accepted_at`, `terms_version`, `price_per_seat_snapshot`, `total_price_snapshot`, `currency`.
- `reservation_audit_log`: zapis zmian statusow rezerwacji wykonywanych przez admina przez RPC; pola `actor_id`, `action_type`, `reservation_id`, `previous_status`, `new_status`, `created_at`.
- `trip_prices`: cena miejsca per trasa (`JW`, `WJ`), waluta, admin aktualizujacy, timestamps.
- `payments`: reczna ewidencja platnosci powiazana z rezerwacja, kwota, waluta, metoda, status, admin potwierdzajacy, notatka.
- `rental_requests`: zapytania o wynajem busa zapisywane w bazie.
- `rental_calendar_blocks`: zakresy niedostepnosci busow dla wynajmu; `bus_id`, `start_date`, `end_date`, `status`, `public_note`, `admin_note`, `source_request_id`, `active`, timestamps.
- `tow_requests`: zapytania o transport laweta zapisywane w bazie.
- `notification_events`: kolejka zdarzen powiadomien, np. nowe zgloszenie rezerwacji, rental/tow request albo anulowanie. Repo nie zawiera jeszcze mechanizmu wysylki tych powiadomien.

Relacje:
- `auth.users -> profiles`: 1:1.
- `trips -> reservations`: 1:N.
- `auth.users -> reservations`: 1:N.
- `reservations -> payments`: 1:N.
- `rental_requests -> rental_calendar_blocks`: opcjonalne powiazanie przez `source_request_id`.
- `rental_calendar_blocks` nie ma relacji do osobnej tabeli pojazdow; `bus_id` odpowiada identyfikatorom z `react-app/src/data/vehicles.js`.

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
- `rental_calendar_blocks`: publiczny odczyt przez RPC `get_rental_calendar_blocks`; administracyjne zarzadzanie blokadami w panelu.
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
- `get_rental_calendar_blocks(...)`: publicznie zwraca aktywne blokady kalendarza wynajmu dla busa i zakresu dat.
- `rental_is_range_available(...)`: sprawdza dostepnosc zakresu wynajmu przed wyslaniem zapytania.
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
- Wynajem busow: wybor pojazdu, wybor zakresu dat, blokady z `rental_calendar_blocks`, zapis zapytania do `rental_requests`.
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
- Zarzadzanie blokadami wynajmu busow w kalendarzu.
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

## 6. Wyniki Testow Produkcyjnych MVP

Rezerwacje - przetestowane i dzialaja:
- Anonim widzi kursy, ale nie moze rezerwowac.
- Uzytkownik bez potwierdzonego maila nie moze rezerwowac.
- Uzytkownik z potwierdzonym mailem tworzy rezerwacje ze statusem `requested`.
- `requested` nie blokuje miejsca.
- Admin zmienia `requested` na `accepted`.
- `accepted` blokuje miejsce.
- Admin zmienia statusy `payment_pending`, `confirmed`, `rejected`, `cancelled_admin`.
- Uzytkownik anuluje wlasna rezerwacje.
- `reservation_audit_log` zapisuje akcje admina.

Ceny - przetestowane i dzialaja:
- Admin zmienia cene `JW`.
- Admin zmienia cene `WJ`.
- Uzytkownik widzi cene w `/booking`.
- Nowa rezerwacja zapisuje `price_per_seat_snapshot`.
- Zmiana ceny nie zmienia starych rezerwacji.

Platnosci reczne - przetestowane i dzialaja:
- Admin oznacza platnosc jako `unpaid`, `pending`, `paid`, `refunded`, `cancelled`.
- Tabela `payments` aktualizuje sie poprawnie.
- Uzytkownik nie widzi technicznego statusu platnosci.

Wynajem busa - przetestowane i dziala:
- Formularz zapisuje `rental_request`.
- Admin widzi zapytanie.
- Admin zmienia status zapytania.

Laweta - przetestowane i dziala:
- Formularz zapisuje `tow_request`.
- Admin widzi zapytanie.
- Admin zmienia status i `estimated_price`.

Notification events - przetestowane i dzialaja jako zapis zdarzen:
- Po rezerwacji powstaje event.
- Po anulowaniu powstaje event.
- Po rental/tow request powstaje event.
- Realna wysylka powiadomien na podstawie `notification_events` pozostaje w TODO.

## 7. Scenariusze Uzytkownikow

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
4. Admin generuje kursy, odwoluje je i zarzadza blokadami wynajmu busow.
5. Admin widzi `requested` jako nowe zgloszenia.
6. Admin ustawia status przez RPC: `accepted`, `payment_pending`, `confirmed`, `rejected`, `cancelled_admin`.
7. Zmiany statusu rezerwacji zapisuja sie w `reservation_audit_log`.
8. Admin ustawia ceny tras, recznie oznacza platnosci i obsluguje zapytania rental/tow.

## 8. Ryzyka I TODO Po MVP

Zamkniete i potwierdzone testami produkcyjnymi MVP:
- Stary model bezposredniego insert/update do `reservations` przez zwyklego uzytkownika zostal zamkniety w RLS.
- Anonimowe tworzenie rezerwacji przejazdu przez stare RPC zostalo odciete.
- `requested` nie blokuje juz miejsca w `trips_with_seats`.
- Rezerwacja przejazdu wymaga zalogowanego uzytkownika i potwierdzonego emaila.
- Tworzenie i anulowanie rezerwacji odbywa sie przez kontrolowane RPC.
- Adminowe zmiany statusow rezerwacji dzialaja i zapisuja audit log.
- Ceny tras i snapshoty cen w rezerwacjach dzialaja.
- Reczna ewidencja platnosci dziala.
- Zapytania rental/tow zapisuja sie i sa obslugiwane w panelu admina.
- `notification_events` powstaja po rezerwacji, anulowaniu oraz rental/tow request.

TODO po MVP:
- Poprawki wizualne/UX.
- Cloudflare Turnstile / antyspam.
- Rate limiting.
- Realna wysylka `notification_events`.
- Regulamin i polityka prywatnosci.
- SEO: `title`, `meta`, `sitemap`, `robots`, Open Graph, structured data.
- Domena produkcyjna.
- Backupy Supabase.
- Monitoring bledow.
- Aktualizacja zaleznosci / `npm audit`.
- Uporzadkowanie testowych danych.

## 9. Uruchomienie Lokalne

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

## 10. Deploy Na Render

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

## 11. Production Readiness Checklist

Gotowe i potwierdzone testami produkcyjnymi MVP:
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
- Produkcja nie uzywa juz `create_reservation_atomic`.
- Anonim nie moze rezerwowac przejazdu.
- Uzytkownik bez potwierdzonego emaila nie moze rezerwowac przejazdu.
- Potwierdzony uzytkownik tworzy `requested`.
- `requested` nie zmniejsza wolnych miejsc.
- Admin zmienia status przez `admin_set_reservation_status`.
- Zmiana statusu blokujacego respektuje dostepne miejsca.
- Anulowanie dziala przez `cancel_own_reservation`.
- `reservation_audit_log` zapisuje akcje admina.
- Ceny sa widoczne w `/booking` i zapisywane przez admina.
- Nowe rezerwacje zapisuja `price_per_seat_snapshot`.
- Zmiana ceny nie zmienia starych rezerwacji.
- Platnosci zapisuje admin przez RPC i tabela `payments` aktualizuje sie poprawnie.
- Uzytkownik nie widzi technicznego statusu platnosci.
- Rental/tow requests zapisuja sie w bazie i sa widoczne w panelu admina.
- Admin zmienia status rental/tow request oraz `estimated_price` dla lawety.
- `notification_events` powstaja po rezerwacji, anulowaniu oraz rental/tow request.

Do potwierdzenia / utrzymania operacyjnego:
- Supabase Auth redirect URLs sa poprawne.
- Pierwszy admin istnieje w `profiles`.
- Migracje sa faktycznie wdrozone na produkcyjnej bazie.

Nadal do zrobienia:
- Poprawki wizualne/UX.
- Cloudflare Turnstile / antyspam.
- Rate limiting.
- Realna wysylka `notification_events`.
- Domena produkcyjna.
- SEO: `title`, `meta`, `sitemap`, `robots`, Open Graph, structured data.
- Regulamin i polityka prywatnosci.
- Backupy Supabase.
- Monitoring bledow.
- Aktualizacja zaleznosci po `npm audit`.
- Uporzadkowanie testowych danych.

## 12. Dane Potrzebne Dla ChatGPT Do Przygotowania Listy Testow Systemu

Projekt: React 18 + Vite 5 + Supabase + Render Static Site.

Trasy: `/`, `/rental`, `/booking`, `/tow`, `/contact`, `/auth`, `/my-reservations`, `/admin`, `/verify-email`, `/reset-password`.

Supabase:
- Tabele: `profiles`, `trips`, `reservations`, `reservation_audit_log`, `trip_prices`, `payments`, `rental_requests`, `rental_calendar_blocks`, `tow_requests`, `notification_events`.
- Widok: `trips_with_seats`.
- Funkcja miejsc: `reservation_blocks_seat`.
- RPC rezerwacji: `create_reservation_request`, `cancel_own_reservation`, `admin_set_reservation_status`.
- RPC cen/platnosci: `admin_set_trip_price`, `admin_set_payment_status`.
- RPC zapytan i wynajmu: `get_rental_calendar_blocks`, `rental_is_range_available`, `create_rental_request`, `create_tow_request`, `admin_update_rental_request`, `admin_update_tow_request`.
- Stare RPC `create_reservation_atomic` nie powinno istniec po migracji secure reservations ani byc uzywane przez frontend.

Auth:
- Email/password, rejestracja, potwierdzenie emaila, reset hasla.
- Role produkcyjne: `user`, `admin`, `owner`, `tech_admin`, `operator`.
- Dostep do panelu admina w UI obejmuje role administracyjne; operacje bazowe nadal musza byc zgodne z RLS/RPC Supabase.
- Rezerwacja przejazdu wymaga `authenticated` i potwierdzonego emaila.

Statusy rezerwacji:
- `requested`: nowy request, nie blokuje miejsca.
- Blokuja miejsce: `accepted`, `payment_pending`, `paid`, `confirmed`.
- Nie blokuja miejsca: `rejected`, `cancelled_user`, `cancelled_admin`, `expired`, `no_show`.

RLS aktualny:
- `reservations`: brak direct insert/update/delete dla zwyklych uzytkownikow; `authenticated` SELECT swoich, admin SELECT wszystkich; zmiany przez RPC.
- `trips`: publiczny odczyt, zapis admin.
- `rental_calendar_blocks`: publiczny odczyt przez RPC, zarzadzanie admin.
- `trip_prices`: publiczny odczyt, zapis przez admin RPC.
- `payments`, `reservation_audit_log`, `notification_events`: admin.
- `rental_requests`, `tow_requests`: tworzenie przez RPC dla anon/auth, podglad/aktualizacja admin.

Publiczne funkcje do testow:
- Anonim oglada kursy i wolne miejsca.
- Anonim nie moze zarezerwowac przejazdu.
- Zalogowany bez potwierdzonego emaila nie moze zarezerwowac przejazdu.
- Zalogowany z potwierdzonym emailem moze wyslac `requested`.
- Rental/tow zapisuja request do bazy.
- Rental uzywa blokad `rental_calendar_blocks` i walidacji zakresu dat.
- Moje rezerwacje pokazuja rezerwacje zalogowanego uzytkownika.
- Anulowanie wlasnej rezerwacji dziala przez RPC.

Admin do testow:
- Generowanie kursow miesiecznych.
- Dodawanie/odwolywanie/przywracanie kursow.
- Blokady wynajmu busow.
- Lista rezerwacji z `requested`.
- Zmiana statusow rezerwacji.
- Audit log statusow.
- Ceny tras.
- Reczne platnosci.
- Zapytania rental/tow.

Ryzyka i TODO nadal otwarte:
- Poprawki wizualne/UX.
- Brak Cloudflare Turnstile / antyspam.
- Brak rate limitingu.
- Brak faktycznej wysylki powiadomien admina.
- Brak backupow opisanych w repo.
- Redirecty Auth i custom domain/SSL.
- SEO/sitemap/robots/OG.
- Brak monitoringu bledow.
- Podatnosci `vite/esbuild` z `npm audit`.
- Regulamin i polityka prywatnosci do finalizacji.
- Uporzadkowanie testowych danych.

## 13. Aktualny Status Etapow

- Etap 1/2: secure reservations - wdrozone i potwierdzone testami produkcyjnymi MVP.
- Etap 3: ceny i reczne platnosci - wdrozone i potwierdzone testami produkcyjnymi MVP.
- Etap 4: rental/tow requests - wdrozone i potwierdzone testami produkcyjnymi MVP.
- Etap 5: notification events - zapis zdarzen wdrozony i potwierdzony testami; realna wysylka powiadomien do zrobienia.
- Etap 6: testy produkcyjne MVP - wykonane dla zakresu opisanego w sekcji 6.
- Etap 7: prace post-MVP - lista TODO w sekcji 8.
