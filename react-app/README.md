# Dokumentacja projektu React - Wynajem Busów Jarosław

Stan dokumentacji: 2026-06-04.

Ten katalog zawiera nową wersję aplikacji przepisaną na React + Vite. W katalogu głównym repozytorium nadal znajdują się stare pliki statyczne `index.html`, `verify-email.html` i `reset-password.html`. Są one istotne do czasu przepięcia usługi Render na katalog `react-app`.

## 1. Stack technologiczny

- React 18 - interfejs aplikacji i stan widoków.
- Vite 5 - lokalny dev server i build produkcyjny.
- Supabase JS v2 - Auth, zapytania do bazy, sesje użytkownika.
- Supabase Auth - logowanie, rejestracja, reset hasła, potwierdzanie emaila.
- Supabase Postgres - tabele przejazdów, rezerwacji, profili i dostępności busów.
- CSS natywny - cała warstwa wizualna w `src/styles.css`, bez Tailwinda i bez frameworka UI.
- Render Static Site - docelowy hosting produkcyjny po ustawieniu `Root Directory` na `react-app`.
- Google Maps embed/link - podgląd trasy lawety i linki do tras.
- `mailto:` - wysyłka zapytań o wynajem busa i lawetę przez klienta pocztowego użytkownika.

## 2. Struktura folderów i plików

```text
react-app/
  .gitignore
  index.html
  package.json
  vite.config.js
  public/
    reset-password.html
    verify-email.html
  src/
    main.jsx
    styles.css
```

Pliki istotne dla działania aplikacji:

- `react-app/index.html` - punkt wejścia Vite, zawiera `<div id="root"></div>` i ładuje `/src/main.jsx`.
- `react-app/package.json` - zależności, skrypty `dev`, `build`, `preview`.
- `react-app/vite.config.js` - konfiguracja Vite z pluginem React.
- `react-app/src/main.jsx` - cała logika aplikacji React: konfiguracja Supabase, stan, komponenty, formularze, admin panel.
- `react-app/src/styles.css` - cała warstwa UI, layout, responsywność, paleta kolorów.
- `react-app/public/verify-email.html` - osobna strona obsługująca link potwierdzający email z Supabase.
- `react-app/public/reset-password.html` - osobna strona obsługująca link resetu hasła z Supabase.
- `react-app/.gitignore` - ignoruje `node_modules`, `dist`, pliki `.env` i logi.

Pliki poza `react-app`, nadal ważne operacyjnie:

- `index.html` - stara statyczna wersja strony. Będzie używana, dopóki Render nie zostanie przepięty na `react-app`.
- `verify-email.html` - stara kopia strony potwierdzania emaila dla obecnego statycznego deploya.
- `reset-password.html` - stara kopia strony resetowania hasła dla obecnego statycznego deploya.

## 3. Funkcje aplikacji

### Strona startowa

- Prezentuje ofertę transportu ludzi, wynajmu busów i transportu lawetą.
- Ma trzy główne akcje: rezerwacja przejazdu, sprawdzenie busów, logowanie.
- Wykorzystuje hero z realnym zdjęciem busa i spokojniejszą paletą kolorów.

### Wynajem busów

- Lista dostępnych pojazdów:
  - Mercedes-Benz Vito.
  - Volkswagen Caravelle.
- Karty pojazdów z opisem, zdjęciem i cechami.
- Cennik orientacyjny.
- Kalendarz dostępności dla wybranego busa.
- Pobieranie dostępności z tabeli `bus_availability`.
- Domyślnie przyszłe terminy są traktowane jako dostępne, jeżeli w bazie nie ma wpisu z blokadą.
- Co 15 sekund aplikacja odświeża dostępność na stronie wynajmu.
- Po powrocie do karty przeglądarki aplikacja odświeża dostępność.
- Przed wysłaniem zapytania aplikacja ponownie sprawdza dostępność wybranego dnia.
- Formularz zapytania tworzy wiadomość email przez `mailto:`.

### Przejazdy Jarosław-Wiedeń

- Obsługa dwóch kierunków:
  - `JW` - Jarosław -> Wiedeń.
  - `WJ` - Wiedeń -> Jarosław.
- Diagram trasy i lista przystanków.
- Możliwość wyboru przystanku wsiadania i wysiadania.
- Kalendarz dostępnych kursów.
- Liczba wolnych miejsc liczona z danych `trips_with_seats`, a gdy widok nie działa, z tabel `trips` i `reservations`.
- Blokowanie kursów odwołanych.
- Blokowanie kursów bez wolnych miejsc.
- Walidacja, że miejsce wysiadania jest dalej na trasie niż miejsce wsiadania.
- Przed zapisem rezerwacji aplikacja ponownie pobiera świeży stan miejsc.
- Zapis rezerwacji do tabeli `reservations`.
- Rezerwacja może być powiązana z zalogowanym użytkownikiem przez `user_id`.

### Moje rezerwacje

- Widok dostępny po zalogowaniu.
- Pobiera rezerwacje aktualnego użytkownika z tabeli `reservations`.
- Pokazuje statusy rezerwacji i daty kursów.
- Pozwala anulować własną rezerwację przez ustawienie `status = 'cancelled'`.

### Autoryzacja

- Logowanie email + hasło.
- Rejestracja z imieniem, nazwiskiem, emailem, hasłem i telefonem.
- Reset hasła przez Supabase Auth.
- Potwierdzanie emaila przez osobną stronę `verify-email.html`.
- Reset hasła przez osobną stronę `reset-password.html`.
- Sesja jest odczytywana przy starcie aplikacji przez `sb.auth.getSession()`.
- Zmiany sesji są obsługiwane przez `sb.auth.onAuthStateChange()`.

### Transport lawetą

- Widok informacyjny o transporcie pojazdów.
- Mapa Google z trasą Jarosław -> Wiedeń.
- Formularz zapytania o lawetę.
- Zapytanie otwierane jako email przez `mailto:`.

### Panel właściciela

Panel jest widoczny tylko dla użytkownika, którego profil ma `role = 'admin'`.

Funkcje panelu:

- Zakładka `Terminy kursów`:
  - lista kursów w danym miesiącu,
  - przełączanie kierunku `JW` / `WJ`,
  - dodanie kursu kliknięciem dnia,
  - odwołanie lub przywrócenie kursu,
  - automatyczne wystawienie kursów na miesiąc:
    - niedziele dla `JW`,
    - piątki dla `WJ`.
- Zakładka `Dostępność busów`:
  - wybór busa,
  - kalendarz dostępności,
  - przełączanie dnia dostępny/niedostępny,
  - zapis do `bus_availability`.
- Zakładka `Rezerwacje`:
  - lista wszystkich rezerwacji,
  - dane pasażera,
  - liczba miejsc,
  - powiązany kurs.

## 4. Routing

Aplikacja nie używa React Routera. Routing jest stanowy, w komponencie `App`, przez `activePage`.

Widoki wewnętrzne:

```text
home      -> HomePage
rental    -> RentalPage
auth      -> AuthPage
booking   -> BookingPage
tow       -> TowPage
myres     -> MyReservationsPage
contact   -> ContactPage
admin     -> AdminPage, tylko dla role=admin
```

Konsekwencje obecnego routingu:

- Wszystkie główne widoki działają pod adresem `/`.
- Odświeżenie strony wraca do widoku domyślnego `home`.
- Nie ma deep linków typu `/admin` albo `/booking`.
- Dla SEO i wygodnego linkowania w przyszłości warto dodać React Router.

Osobne strony publiczne:

```text
/verify-email.html
/reset-password.html
```

Te strony nie są komponentami React. Są kopiowane z `public/` do `dist/` przez Vite i muszą istnieć jako osobne URL-e, bo Supabase Auth przekierowuje użytkownika bezpośrednio na nie.

## 5. Komponenty React

Wszystkie komponenty znajdują się aktualnie w `src/main.jsx`.

- `App` - główny komponent, trzyma stan aplikacji, sesję użytkownika, wybrany widok, dane kalendarzy, formularzy i panelu admina.
- `Message` - uniwersalny komunikat `ok`, `err`, `info`.
- `Card` - wspólna obudowa sekcji/kart.
- `HomePage` - strona startowa i kafle usług.
- `Hero` - nagłówek podstrony.
- `RentalPage` - widok wynajmu busów.
- `RentalCalendar` - kalendarz dostępności busa.
- `Weekdays` - nagłówki dni tygodnia.
- `AuthPage` - logowanie, rejestracja, reset hasła.
- `BookingPage` - rezerwacje kursów Jarosław-Wiedeń.
- `RouteDiagram` - wizualna lista przystanków trasy.
- `TowPage` - widok lawety i formularz zapytania.
- `MyReservationsPage` - lista rezerwacji użytkownika.
- `Summary` - kafel statystyki w rezerwacjach użytkownika.
- `ContactPage` - prosty widok kontaktowy.
- `AdminPage` - kontener panelu właściciela.
- `AdminTrips` - zarządzanie kursami.
- `AdminTripList` - lista kursów dla kierunku.
- `AdminBuses` - zarządzanie dostępnością busów.
- `AdminReservations` - lista rezerwacji w panelu admina.

Helpery i funkcje użytkowe:

- `todayStr()` - data dzisiejsza w formacie `YYYY-MM-DD`.
- `formatDate(date)` - data po polsku.
- `monthRange(viewDate)` - zakres miesiąca dla kalendarzy.
- `dateOnly(value)` - normalizacja daty do `YYYY-MM-DD`.
- `tripDate(trip)` - data kursu.
- `tripMaxSeats(trip)` - liczba miejsc w kursie z fallbackiem do `MAX_SEATS`.
- `tripUsedSeats(trip)` - zajęte miejsca.
- `tripFreeSeats(trip)` - wolne miejsca.
- `normalizeTrips(trips)` - normalizacja kursów z widoku lub tabel.
- `busIdFromLabel(label)` - mapowanie etykiety busa na ID.
- `defaultBusAvailable(dateStr)` - domyślna dostępność busa.
- `lastStop(stops)` - ostatni przystanek trasy.
- `buildMailto(subject, body)` - budowa linku email.

Najważniejsze funkcje asynchroniczne:

- `onLogin(user)` - zapisuje użytkownika i pobiera profil z `profiles`.
- `onLogout()` - czyści użytkownika i profil.
- `fetchTripsWithSeats(from, to)` - pobiera kursy z wolnymi miejscami.
- `loadTrips()` - ładuje kursy do kalendarza rezerwacji.
- `fetchBusAvailability(busId, viewDate)` - pobiera dostępność busa.
- `fetchBusAvailabilityForDate(busId, dateStr)` - sprawdza dostępność jednego dnia.
- `loadRentalBusAvailability(silent)` - ładuje dostępność dla widoku wynajmu.
- `saveBusAvailability(busId, dateStr, available)` - zapisuje dostępność busa.
- `loadAdminBusAvailability()` - ładuje dostępność busa w panelu.
- `doLogin(event)` - logowanie.
- `doRegister(event)` - rejestracja.
- `doReset(event)` - wysłanie linku resetu hasła.
- `signOut()` - wylogowanie.
- `submitRentalRequest(event)` - zapytanie o wynajem busa.
- `submitTowRequest(event)` - zapytanie o lawetę.
- `selectBookingDay(dateStr)` - wybór kursu w kalendarzu.
- `submitBooking(event)` - zapis rezerwacji.
- `loadMyReservations()` - pobranie rezerwacji użytkownika.
- `cancelReservation(resId)` - anulowanie własnej rezerwacji.
- `loadAdminTrips()` - pobranie kursów do panelu.
- `toggleAdminTripDate(dateStr)` - dodanie lub przełączenie kursu w dniu.
- `toggleTrip(id, cancel)` - odwołanie lub przywrócenie kursu.
- `generateMonth()` - wygenerowanie kursów na miesiąc.
- `loadAdminReservations()` - pobranie rezerwacji do panelu admina.
- `toggleAdminBusDate(dateStr)` - przełączenie dostępności busa.

## 6. Integracja z Supabase

Konfiguracja Supabase znajduje się obecnie w `src/main.jsx`:

- `SB_URL` - adres projektu Supabase.
- `SB_KEY` - publiczny publishable/anon key.
- `PUBLIC_APP_ORIGIN` - produkcyjny adres aplikacji używany do redirectów.
- `AUTH_REDIRECTS.verifyEmail` - URL do `/verify-email.html`.
- `AUTH_REDIRECTS.resetPassword` - URL do `/reset-password.html`.

Ważne:

- Klucz `publishable` / `anon` może być w frontendzie, ale `service_role` nigdy nie może trafić do Reacta.
- Docelowo konfigurację należy przenieść do zmiennych środowiskowych Vite.
- Strony `public/verify-email.html` i `public/reset-password.html` też mają własną konfigurację Supabase. Ponieważ pliki w `public/` są kopiowane bez bundlowania, nie korzystają automatycznie z `import.meta.env`.

Operacje Supabase w aplikacji:

- `sb.auth.getSession()` - odczyt sesji po starcie.
- `sb.auth.onAuthStateChange()` - obserwowanie logowania/wylogowania.
- `sb.auth.signInWithPassword()` - logowanie.
- `sb.auth.signUp()` - rejestracja z redirectem potwierdzania emaila.
- `sb.auth.resetPasswordForEmail()` - wysłanie resetu hasła.
- `sb.auth.signOut()` - wylogowanie.
- `sb.from('profiles').select()` - pobranie profilu i roli.
- `sb.from('trips_with_seats').select()` - preferowany odczyt kursów z wolnymi miejscami.
- `sb.from('trips').select()/insert()/update()` - fallback odczytu i administrowanie kursami.
- `sb.from('reservations').select()/insert()/update()` - rezerwacje i anulowanie.
- `sb.from('bus_availability').select()/upsert()` - dostępność busów.

## 7. Tabele, RLS i storage

W repozytorium nie ma jeszcze migracji SQL. Poniższy model jest odtworzony z kodu i powinien zostać zapisany jako migracje przed produkcją.

### `profiles`

Przeznaczenie: profil użytkownika i rola.

Pola wymagane przez aplikację:

```text
id uuid primary key references auth.users(id)
role text
phone text
created_at timestamptz
updated_at timestamptz
```

Kod korzysta głównie z:

- `profiles.id`
- `profiles.role`
- `profiles.phone`

Wartości roli:

- `admin` - dostęp do panelu właściciela.
- inna wartość lub `null` - zwykły użytkownik.

### `trips`

Przeznaczenie: terminy regularnych kursów.

Pola wymagane przez aplikację:

```text
id text primary key
route text not null
date date not null
cancelled boolean default false
max_seats integer default 7
created_at timestamptz
updated_at timestamptz
```

Wartości `route`:

- `JW` - Jarosław -> Wiedeń.
- `WJ` - Wiedeń -> Jarosław.

Zalecane ograniczenia:

```sql
alter table public.trips
  add constraint trips_route_check check (route in ('JW', 'WJ'));

alter table public.trips
  add constraint trips_max_seats_check check (max_seats > 0);
```

### `reservations`

Przeznaczenie: rezerwacje miejsc na kursach.

Pola wymagane przez aplikację:

```text
id text primary key
trip_id text references public.trips(id)
user_id uuid references auth.users(id), nullable
passenger_name text not null
passenger_email text not null
passenger_phone text
seats integer not null
notes text
status text default 'confirmed'
created_at timestamptz
updated_at timestamptz
```

Wartości `status`:

- `confirmed`
- `cancelled`

Zalecane ograniczenia:

```sql
alter table public.reservations
  add constraint reservations_status_check check (status in ('confirmed', 'cancelled'));

alter table public.reservations
  add constraint reservations_seats_check check (seats > 0);
```

Uwaga produkcyjna:

- Frontend sprawdza wolne miejsca przed zapisem, ale to nie zastępuje ochrony po stronie bazy.
- Przy dużym ruchu potrzebna jest transakcja, RPC albo Edge Function, która atomowo sprawdzi liczbę miejsc i zapisze rezerwację.

### `bus_availability`

Przeznaczenie: ręczne blokowanie lub odblokowanie dostępności busów.

Pola wymagane przez aplikację:

```text
bus_id text not null
date date not null
available boolean not null default true
created_at timestamptz
updated_at timestamptz
primary key (bus_id, date)
```

Wartości `bus_id` używane w aplikacji:

- `bus9`
- `bus8`

Zalecane ograniczenie:

```sql
alter table public.bus_availability
  add constraint bus_availability_bus_id_check check (bus_id in ('bus9', 'bus8'));
```

### `trips_with_seats`

Przeznaczenie: widok kursów z policzonymi miejscami.

Pola oczekiwane przez aplikację:

```text
id
route
date
cancelled
max_seats
used_seats
free_seats
```

Przykładowy widok:

```sql
create or replace view public.trips_with_seats as
select
  t.id,
  t.route,
  t.date,
  t.cancelled,
  coalesce(t.max_seats, 7) as max_seats,
  coalesce(sum(r.seats) filter (where r.status <> 'cancelled'), 0) as used_seats,
  greatest(
    coalesce(t.max_seats, 7) - coalesce(sum(r.seats) filter (where r.status <> 'cancelled'), 0),
    0
  ) as free_seats
from public.trips t
left join public.reservations r on r.trip_id = t.id
group by t.id, t.route, t.date, t.cancelled, t.max_seats;
```

### RLS - wymagany kierunek

Poniższe policies są rekomendowanym minimum. Trzeba je dopasować do faktycznych uprawnień w projekcie Supabase.

Funkcja pomocnicza:

```sql
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;
```

`profiles`:

```sql
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
on public.profiles
for select
to authenticated
using (id = auth.uid() or public.is_admin());

create policy "profiles_update_own_basic"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());
```

Uwaga: zmiana `role` powinna być dostępna tylko przez panel Supabase albo backend z `service_role`, nie przez zwykły frontend.

`trips`:

```sql
alter table public.trips enable row level security;

create policy "trips_select_public"
on public.trips
for select
to anon, authenticated
using (true);

create policy "trips_admin_insert"
on public.trips
for insert
to authenticated
with check (public.is_admin());

create policy "trips_admin_update"
on public.trips
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

`reservations`:

```sql
alter table public.reservations enable row level security;

create policy "reservations_insert_authenticated_own"
on public.reservations
for insert
to authenticated
with check (user_id = auth.uid() or public.is_admin());

create policy "reservations_insert_guest"
on public.reservations
for insert
to anon
with check (user_id is null);

create policy "reservations_select_own_or_admin"
on public.reservations
for select
to authenticated
using (user_id = auth.uid() or public.is_admin());

create policy "reservations_update_own_cancel_or_admin"
on public.reservations
for update
to authenticated
using (user_id = auth.uid() or public.is_admin())
with check (user_id = auth.uid() or public.is_admin());
```

Uwaga: policy `reservations_insert_guest` jest wygodna, ale ryzykowna. Do produkcji lepiej wymagać logowania, dodać CAPTCHA albo przenieść zapis do Edge Function.

`bus_availability`:

```sql
alter table public.bus_availability enable row level security;

create policy "bus_availability_select_public"
on public.bus_availability
for select
to anon, authenticated
using (true);

create policy "bus_availability_admin_insert"
on public.bus_availability
for insert
to authenticated
with check (public.is_admin());

create policy "bus_availability_admin_update"
on public.bus_availability
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
```

Widok `trips_with_seats`:

```sql
grant select on public.trips_with_seats to anon, authenticated;
```

### Storage

Aplikacja obecnie nie używa Supabase Storage.

Zdjęcia busów są ładowane z zewnętrznych URL-i. Do produkcji zalecane jest przeniesienie zdjęć do:

- katalogu `public/` w projekcie,
- Supabase Storage,
- albo zewnętrznego CDN.

Jeżeli zostanie dodany Supabase Storage, potrzebny będzie osobny bucket, np. `vehicle-assets`, z publicznym odczytem i zapisem tylko dla admina.

## 8. Autoryzacja i role

### Typy użytkowników

- Gość:
  - widzi stronę startową,
  - widzi busy,
  - widzi kalendarze,
  - może wysłać zapytanie email,
  - aktualnie może złożyć rezerwację, jeżeli RLS pozwala na guest insert.
- Zalogowany użytkownik:
  - może rezerwować przejazdy z przypisaniem `user_id`,
  - widzi `Moje rezerwacje`,
  - może anulować swoje rezerwacje.
- Admin:
  - ma wszystko, co zwykły użytkownik,
  - widzi zakładkę `Panel`,
  - zarządza kursami,
  - zarządza dostępnością busów,
  - widzi rezerwacje wszystkich użytkowników.

### Źródło roli

Rola jest pobierana z tabeli `profiles`:

```js
sb.from('profiles').select('*').eq('id', user.id).single()
```

Panel admina pojawia się, gdy:

```js
currentProfile?.role === 'admin'
```

To jest tylko kontrola UI. Prawdziwe zabezpieczenie musi być w RLS.

### Redirecty Auth

Rejestracja:

```text
/verify-email.html
```

Reset hasła:

```text
/reset-password.html
```

W Supabase Dashboard należy ustawić:

- Site URL: produkcyjny adres aplikacji.
- Additional Redirect URLs:
  - `https://twoja-domena/verify-email.html`
  - `https://twoja-domena/reset-password.html`
  - ewentualnie adres Render, dopóki domena niestandardowa nie jest gotowa.

## 9. Zmienne środowiskowe

Aktualnie `src/main.jsx` i pliki w `public/` mają konfigurację wpisaną jako stałe. Do produkcji należy przenieść konfigurację Reacta do `.env.local` lokalnie i zmiennych środowiskowych w Render.

Proponowane zmienne bez wartości:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PUBLIC_APP_ORIGIN=
VITE_CONTACT_EMAIL=
```

Znaczenie:

- `VITE_SUPABASE_URL` - adres projektu Supabase.
- `VITE_SUPABASE_PUBLISHABLE_KEY` - publiczny klucz anon/publishable.
- `VITE_PUBLIC_APP_ORIGIN` - produkcyjny origin aplikacji, np. domena Render albo domena własna.
- `VITE_CONTACT_EMAIL` - email do zapytań z formularzy.

Nie wolno dodawać do frontendu:

```bash
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
JWT_SECRET=
SMTP_PASSWORD=
```

Uwaga: pliki `public/verify-email.html` i `public/reset-password.html` nie są przetwarzane przez bundler, więc nie odczytają automatycznie `VITE_*`. Dla pełnego rozwiązania trzeba:

- przenieść reset i verify do Reacta,
- albo generować te pliki podczas builda,
- albo trzymać w nich tylko publiczną konfigurację Supabase.

## 10. Instrukcja lokalnego uruchomienia

Wymagania:

- Node.js 18+ albo 20 LTS.
- npm.
- Dostęp do projektu Supabase.

Kroki:

```bash
cd react-app
npm install
npm run dev
```

Vite domyślnie uruchomi aplikację lokalnie, zwykle pod:

```text
http://localhost:5173
```

Podgląd builda produkcyjnego:

```bash
cd react-app
npm run build
npm run preview
```

W tym środowisku lokalnym nie wykonano builda, bo komenda `node` nie była dostępna.

## 11. Instrukcja build/deploy

### Render

Typ usługi:

```text
Static Site
```

Ustawienia:

```text
Root Directory: react-app
Build Command: npm install && npm run build
Publish Directory: dist
```

Po przepięciu Render na `react-app`:

- główna aplikacja React będzie serwowana z `dist/index.html`,
- `verify-email.html` i `reset-password.html` będą dostępne z `dist/`, bo pochodzą z `public/`,
- stara rootowa wersja `index.html` nie będzie używana przez Render dla tej usługi.

### Deploy przez GitHub

Projekt został dodany do repo jako katalog `react-app`. Render powinien pobierać commit z gałęzi `main`.

### Build lokalny

```bash
cd react-app
npm install
npm run build
```

Po udanym buildzie powinien powstać katalog:

```text
react-app/dist/
```

`dist/` jest ignorowany przez git.

## 12. Aktualny status projektu

### Działa w kodzie React

- Strona startowa.
- Nawigacja stanowa między widokami.
- Logowanie i wylogowanie przez Supabase.
- Rejestracja z redirectem potwierdzania emaila.
- Reset hasła z redirectem na osobną stronę.
- Widok wynajmu busów.
- Kalendarz dostępności busów.
- Odświeżanie dostępności busów co 15 sekund na stronie wynajmu.
- Ponowne sprawdzenie dostępności przed wysłaniem zapytania o busa.
- Widok przejazdów Jarosław-Wiedeń i Wiedeń-Jarosław.
- Rezerwowanie miejsc z ponownym sprawdzeniem dostępności.
- Widok własnych rezerwacji.
- Anulowanie własnych rezerwacji.
- Panel admina zależny od `profiles.role`.
- Dodawanie, anulowanie i przywracanie kursów przez admina.
- Generowanie kursów na miesiąc.
- Zarządzanie dostępnością busów przez admina.
- Lista rezerwacji w panelu admina.
- Formularz zapytania o lawetę przez email.
- Strony `/verify-email.html` i `/reset-password.html` w katalogu `public`.

### Niezweryfikowane lokalnie

- `npm install`, bo lokalnie nie było komendy `node`.
- `npm run build`, z tego samego powodu.
- Pełne działanie produkcyjne po przepięciu Render na `react-app`.
- RLS w Supabase, bo migracje/policies nie są zapisane w repo.
- Zgodność struktury tabel z rekomendowanym modelem, bo schemat bazy nie jest wersjonowany w repo.

### Nie działa albo jest ograniczone projektowo

- Brak React Routera, więc nie ma bezpośrednich linków do podstron typu `/booking`.
- Brak backendowej atomowości rezerwacji miejsc.
- Formularze wynajmu i lawety nie zapisują zapytań w bazie, tylko otwierają klienta pocztowego.
- Brak testów automatycznych.
- Brak package-lock, dopóki nie zostanie uruchomione `npm install`.
- Konfiguracja Supabase jest jeszcze wpisana w kod, nie w zmienne środowiskowe.
- Publiczne strony resetu i verify mają osobną konfigurację, którą trzeba synchronizować.
- Zdjęcia pojazdów są ładowane z zewnętrznych URL-i.

### Wymaga dopracowania

- Rozbicie `src/main.jsx` na mniejsze pliki:
  - `components/`,
  - `pages/`,
  - `lib/supabase.js`,
  - `lib/date.js`,
  - `data/routes.js`,
  - `data/vehicles.js`.
- Dodanie migracji SQL do repo.
- Audyt i wdrożenie RLS.
- Przeniesienie konfiguracji do env.
- Dodanie walidacji formularzy na poziomie schematów.
- Dodanie obsługi błędów i loading states w większej liczbie miejsc.
- Dodanie testów.
- Uporządkowanie obecności starej statycznej wersji po przepięciu Render.

## 13. Lista rzeczy do uprodukcyjnienia

Priorytet wysoki:

1. Uruchomić `npm install` i zapisać `package-lock.json`.
2. Uruchomić `npm run build` i naprawić ewentualne błędy bundlera.
3. Przepiąć Render:
   - `Root Directory = react-app`,
   - `Build Command = npm install && npm run build`,
   - `Publish Directory = dist`.
4. Ustawić w Supabase poprawne redirect URL-e dla produkcji.
5. Zapisać schemat bazy i policies RLS jako migracje SQL w repo.
6. Zweryfikować RLS na kontach:
   - gość,
   - zwykły użytkownik,
   - admin.
7. Dodać atomowy zapis rezerwacji, najlepiej przez RPC albo Edge Function.
8. Zdecydować, czy rezerwacja bez logowania ma być dozwolona.
9. Dodać zabezpieczenie antyspamowe dla formularzy publicznych.

Priorytet średni:

1. Przenieść konfigurację do `VITE_*`.
2. Dodać `React Router` dla linkowalnych podstron.
3. Rozbić `main.jsx` na moduły.
4. Dodać komponent `ErrorBoundary`.
5. Dodać testy jednostkowe helperów dat i miejsc.
6. Dodać testy integracyjne rezerwacji.
7. Przenieść zdjęcia pojazdów do kontrolowanego źródła.
8. Dodać monitoring błędów, np. Sentry.
9. Dodać podstawowe SEO meta tagi.
10. Dodać ikonę strony i manifest.

Priorytet niższy:

1. Ulepszyć panel admina o filtrowanie rezerwacji.
2. Dodać eksport rezerwacji do CSV.
3. Dodać historię zmian dostępności busów.
4. Dodać powiadomienia email po rezerwacji.
5. Dodać własny system wysyłki zapytań zamiast `mailto:`.
6. Dodać stronę polityki prywatności i regulamin.
7. Dodać obsługę domeny docelowej po zakończeniu prac.

## Uwagi końcowe

Reactowa aplikacja jest przygotowana jako osobny katalog, żeby nie zepsuć aktualnie działającej statycznej wersji. Produkcyjna zamiana nastąpi dopiero po zmianie ustawień Render.

Największe ryzyka przed produkcją są po stronie bazy:

- brak wersjonowanych migracji,
- nieudokumentowany faktyczny RLS w Supabase,
- brak atomowego zapisu rezerwacji.

Frontend ma już dodatkowe odświeżanie i ponowne sprawdzanie dostępności, ale ostateczna pewność braku podwójnych rezerwacji musi powstać w bazie lub backendowej funkcji.
