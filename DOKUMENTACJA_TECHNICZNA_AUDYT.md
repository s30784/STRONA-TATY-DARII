# Dokumentacja Techniczna Do Audytu Produkcyjnego

Stan analizy: repo przejrzane tylko do odczytu; kod nie zostal zmieniony. `npm run build` przechodzi poprawnie. `npm audit` wykazal 2 podatnosci w zaleznosciach deweloperskich zwiazanych z `vite/esbuild`.

## 1. Architektura Projektu

Aplikacja to statyczny frontend React/Vite hostowany jako Static Site na Renderze. Nie ma osobnego backendu aplikacyjnego, API ani Edge Functions. Backendowa role pelni Supabase: Auth, Postgres, RLS, widok `trips_with_seats` oraz RPC `create_reservation_atomic`.

Frontend:
- React 18, Vite 5, React Router.
- Glowna logika aplikacji znajduje sie w `react-app/src/App.jsx`.
- Style globalne: `react-app/src/styles.css`.
- Brak frameworka UI.

Backend / Supabase:
- Klient Supabase: `react-app/src/lib/supabase.js`.
- Migracje SQL: `supabase/migrations/`.
- Tabele: `profiles`, `trips`, `reservations`, `bus_availability`.
- Widok: `trips_with_seats`.
- RPC: `create_reservation_atomic(...)`.

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
- Dostep zalezy od `profiles.role = 'admin'`.
- Operacje admina sa dodatkowo chronione RLS przez `public.is_admin()`.

Integracje zewnetrzne:
- Supabase Auth/Postgres/RLS/RPC.
- Render Static Site.
- Google Maps: linki tras i iframe na stronie lawety.
- `mailto:` dla zapytan o wynajem busa i lawete.
- Zewnetrzne URL-e zdjec pojazdow w `react-app/src/data/vehicles.js`.

## 2. Struktura Katalogow I Najwazniejsze Pliki

```text
STRONA-TATY-DARII/
  render.yaml
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
- `react-app/src/pages/AdminPage.jsx`: widoki admina.
- `react-app/src/pages/BookingPage.jsx`: rezerwacja przejazdu.
- `react-app/src/pages/RentalPage.jsx`: wynajem busow.
- `react-app/src/pages/TowPage.jsx`: zapytanie o lawete.
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
- `VITE_CONTACT_EMAIL`: publiczny adres kontaktowy uzywany w mailto i UI.

Wazne: w Vite kazda zmienna `VITE_*` trafia do bundla frontendowego, wiec jest publiczna. Nie wolno umieszczac w frontendzie:
- `service_role`,
- `DATABASE_URL`,
- hasel SMTP,
- sekretow OAuth,
- prywatnych tokenow Render/Supabase,
- kluczy API niewlasciwych do ekspozycji w przegladarce.

## 4. Supabase

Tabele:
- `profiles`: `id`, `role`, `phone`, `created_at`, `updated_at`; relacja 1:1 do `auth.users`.
- `trips`: `id`, `route`, `date`, `cancelled`, `max_seats`, timestamps; unikalne `(route, date)`.
- `reservations`: `id`, `trip_id`, `user_id`, dane pasazera, `seats`, `notes`, `status`, timestamps.
- `bus_availability`: `bus_id`, `date`, `available`, timestamps; PK `(bus_id, date)`.

Relacje:
- `auth.users -> profiles`: 1:1.
- `trips -> reservations`: 1:N.
- `auth.users -> reservations`: 1:N, nullable.
- `bus_availability` nie ma relacji do osobnej tabeli pojazdow; `bus_id` jest ograniczone checkiem do `bus9`/`bus8`.

RLS:
- `profiles`: uzytkownik widzi swoj profil; admin widzi i aktualizuje profile.
- `trips`: publiczny odczyt; insert/update tylko admin.
- `reservations`: zalogowany uzytkownik widzi i aktualizuje swoje rezerwacje; admin widzi/aktualizuje wszystkie; insert dla authenticated wlasnych rezerwacji.
- `bus_availability`: publiczny odczyt; insert/update tylko admin.

RPC:
- `create_reservation_atomic(...)` blokuje kurs `FOR UPDATE`, sprawdza anulowanie, liczy zajete miejsca i tworzy rezerwacje atomowo.
- Funkcja jest udostepniona dla `anon` i `authenticated`, wiec obsluguje takze rezerwacje bez logowania.

Storage/buckety:
- Brak uzycia Supabase Storage.
- Brak bucketow i polityk storage w migracjach.
- Brak uploadu zdjec w kodzie.

Auth:
- Email/password, rejestracja, login, reset hasla, potwierdzenie emaila.
- Profil tworzony triggerem `handle_new_user()`.
- Admin to uzytkownik z `profiles.role = 'admin'`; pierwszego admina trzeba nadac recznie z poziomu Supabase SQL/Service Role.

## 5. Funkcje Systemu

Publiczne:
- Strona glowna z uslugami i CTA.
- Wynajem busow: wybor pojazdu, kalendarz dostepnosci, zapytanie mailowe.
- Rezerwacja przejazdu Jaroslaw-Wieden / Wieden-Jaroslaw.
- Wybor przystankow, liczby miejsc, danych pasazera.
- Transport laweta: formularz wyceny generujacy email.
- Rejestracja, logowanie, reset hasla, weryfikacja emaila.
- Widok "Moje rezerwacje" dla zalogowanych.
- Anulowanie wlasnej rezerwacji.

Admin:
- Generowanie kursow miesiecznych: niedziele `JW`, piatki `WJ`.
- Dodawanie/odwolywanie/przywracanie kursow.
- Zarzadzanie dostepnoscia busow w kalendarzu.
- Podglad rezerwacji.
- Brak edycji tresci marketingowych z panelu.
- Brak uploadu i zarzadzania zdjeciami.

Formularze:
- Rezerwacja przejazdu zapisuje dane w Supabase przez RPC.
- Wynajem busa i laweta uzywaja `mailto:`, nie zapisuja leadow w bazie.
- Kontakt nie ma osobnego formularza wysylkowego.

## 6. Scenariusze Uzytkownikow

Zwykly uzytkownik:
1. Wchodzi na strone glowna.
2. Przechodzi do wynajmu, przejazdow albo lawety.
3. Sprawdza trase, dostepnosc lub informacje kontaktowe.

Klient wysylajacy formularz:
1. Dla przejazdu wybiera trase, date, przystanki i liczbe miejsc.
2. Wysyla formularz.
3. Frontend wywoluje `create_reservation_atomic`.
4. System zapisuje rezerwacje albo zwraca blad braku miejsc.

Administrator:
1. Loguje sie przez `/auth`.
2. `useAuth` pobiera `profiles.role`.
3. `/admin` renderuje sie tylko dla `role = 'admin'`.
4. Admin generuje kursy, odwoluje je, zarzadza busami i oglada rezerwacje.

## 7. Ryzyka Przed Produkcja

Krytyczne:
- RLS dla `reservations` pozwala authenticated uzytkownikowi wykonac bezposredni insert wlasnej rezerwacji, omijajac RPC i kontrole wolnych miejsc.
- RLS dla `reservations` pozwala uzytkownikowi aktualizowac wlasny rekord szerzej niz samo anulowanie, np. potencjalnie `seats`, `trip_id`, dane pasazera.
- Publiczne RPC bez CAPTCHA/rate limitingu moze byc uzyte do spamowania anonimowymi rezerwacjami.

Wysokie:
- Formularze wynajmu i lawety zaleza od klienta pocztowego uzytkownika; zapytanie moze nie zostac wyslane.
- Brak backendowego zapisu leadow z wynajmu/lawety.
- Brak backupow/retencji opisanych w repo.
- Brak testow automatycznych.
- `npm audit`: podatnosci w `vite/esbuild`; dotyczy glownie dev servera, ale zaleznosci trzeba zaktualizowac przed produkcja.

Srednie:
- Twardo wpisany telefon `+48 123 456 789` w nawigacji.
- SEO/OG/sitemap/robots wskazuja domene `strona-taty-darii.onrender.com`; po custom domain trzeba zmienic.
- Jedno globalne `title`/`description` dla SPA.
- Brak structured data dla lokalnej firmy.
- Zewnetrzne hotlinkowane zdjecia pojazdow moga zniknac, ladowac sie wolno albo miec ryzyka licencyjne.
- Brak centralnego logowania bledow.
- Fallback odczytu miejsc z `reservations` nie jest wiarygodny dla anon/auth, jesli widok `trips_with_seats` nie dziala.

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

Gotowe:
- React/Vite build dziala.
- Render static config istnieje.
- SPA rewrite istnieje.
- Supabase envy sa wydzielone.
- Auth, profile, RLS i RPC sa przygotowane.
- Rezerwacja miejsc przez UI uzywa atomowego RPC.
- Panel admina ma ochrone UI i RLS.

Do sprawdzenia:
- Faktyczna konfiguracja envow na Renderze.
- Supabase Auth redirect URLs.
- Pierwszy admin w `profiles`.
- Migracje na produkcyjnej bazie.
- Custom domain, SSL, sitemap, robots, OG.
- Realny numer telefonu i email.
- Test rezerwacji anonimowej i zalogowanej.
- Test resetu hasla i weryfikacji emaila.

Krytyczne przed oddaniem klientowi:
- Zamknac bezposredni insert/update `reservations`; zostawic rezerwacje/anulowanie przez kontrolowane RPC.
- Dodac ochrone antyspamowa albo limitowanie anonimowych rezerwacji.
- Zdecydowac, czy zapytania wynajmu/lawety maja byc zapisywane w bazie zamiast tylko `mailto:`.
- Ustawic backupy Supabase.
- Zaktualizowac zaleznosci po `npm audit`.
- Przeniesc zdjecia do kontrolowanego hostingu lub Supabase Storage.
- Wykonac pelne testy manualne, bezpieczenstwa i wdrozeniowe.

## Dane potrzebne dla ChatGPT do przygotowania listy testow systemu

Projekt: React 18 + Vite 5 + Supabase + Render Static Site.

Trasy: `/`, `/rental`, `/booking`, `/tow`, `/contact`, `/auth`, `/my-reservations`, `/admin`, `/verify-email`, `/reset-password`.

Supabase: tabele `profiles`, `trips`, `reservations`, `bus_availability`; widok `trips_with_seats`; RPC `create_reservation_atomic`.

Auth: email/password, rejestracja, potwierdzenie emaila, reset hasla, role `user/admin` w `profiles.role`.

Publiczne funkcje: wynajem busow z kalendarzem i `mailto`, rezerwacja przejazdu przez RPC, laweta z `mailto`, moje rezerwacje, anulowanie rezerwacji.

Admin: generowanie kursow miesiecznych, dodawanie/odwolywanie/przywracanie kursow, dostepnosc busow, podglad rezerwacji.

Formularze: booking zapisuje do Supabase; rental/tow generuja email; contact bez formularza.

Deploy: Render root `react-app`, build `npm install && npm run build`, publish `dist`, rewrite `/* -> /index.html`.

Env: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_PUBLIC_APP_ORIGIN`, `VITE_CONTACT_EMAIL`.

Ryzyka testowe: RLS `reservations` direct insert/update, anonimowe RPC, brak CAPTCHA, mailto, redirecty Auth, custom domain/SSL, sitemap/robots/OG, backupy, brak storage/uploadu zdjec, podatnosci `vite/esbuild`.
