# Wynajem Busów Jarosław - React/Vite/Supabase

Stan: 2026-06-04. Ten katalog jest docelową aplikacją produkcyjną. Pliki w katalogu głównym repozytorium (`index.html`, `verify-email.html`, `reset-password.html`) są legacy i zostają do czasu przepięcia Render na `react-app`.

## Stack

- React 18
- Vite 5
- React Router
- Supabase JS v2
- Supabase Auth
- Supabase Postgres + RLS
- Render Static Site
- CSS bez frameworka UI

## Struktura

```text
react-app/
  .env.example
  .gitignore
  index.html
  package.json
  package-lock.json
  public/
    favicon.svg
    og-image.svg
    reset-password.html
    robots.txt
    sitemap.xml
    verify-email.html
  src/
    App.jsx
    main.jsx
    styles.css
    components/
    data/
    hooks/
    lib/
    pages/

../supabase/migrations/
  202606040001_schema.sql
  202606040002_trips_with_seats.sql
  202606040003_rls.sql
  202606040004_create_reservation_atomic.sql
```

## Zmienne środowiskowe

Wymagane zmienne:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
VITE_PUBLIC_APP_ORIGIN=
VITE_CONTACT_EMAIL=
```

Lokalnie utwórz `.env.local` na podstawie `.env.example`.

Nie wolno dodawać do frontendu `service_role`, `DATABASE_URL`, haseł SMTP ani innych sekretów backendowych.

## Lokalny start

```bash
cd react-app
npm install
npm run dev
```

Build produkcyjny:

```bash
cd react-app
npm run build
```

Podgląd builda:

```bash
npm run preview
```

## Render

Ustawienia Static Site:

```text
Root Directory: react-app
Build Command: npm install && npm run build
Publish Directory: dist
```

Dla React Routera potrzebny jest rewrite wszystkich tras do `index.html`. W repo jest `render.yaml` z przykładową konfiguracją:

```yaml
routes:
  - type: rewrite
    source: /*
    destination: /index.html
```

Jeżeli konfigurujesz ręcznie w panelu Render, dodaj taki rewrite w ustawieniach Redirects/Rewrites.

## Supabase Auth Redirect URLs

W Supabase Dashboard ustaw:

- Site URL: produkcyjny origin aplikacji, np. `https://twoja-domena.pl`
- Additional Redirect URLs:
  - `https://twoja-domena.pl/verify-email.html`
  - `https://twoja-domena.pl/reset-password.html`
  - tymczasowo także adres Render, jeśli domena nie jest jeszcze przepięta

Pliki `public/verify-email.html` i `public/reset-password.html` są mostkami. Zachowują query/hash z linku Supabase i przekierowują do tras React:

- `/verify-email`
- `/reset-password`

Dzięki temu właściwa obsługa używa konfiguracji z `VITE_*`.

## Routing

Publiczne trasy React Routera:

- `/`
- `/rental`
- `/booking`
- `/tow`
- `/contact`
- `/auth`
- `/my-reservations`

Trasy techniczne Auth:

- `/verify-email`
- `/reset-password`

Trasa chroniona:

- `/admin`

`/admin` jest renderowane tylko dla użytkownika z `profiles.role = 'admin'`. Brak admina pokazuje komunikat o braku dostępu.

## Supabase

Klient Supabase jest w:

```text
src/lib/supabase.js
```

Ten plik:

- czyta `VITE_SUPABASE_URL`,
- czyta `VITE_SUPABASE_PUBLISHABLE_KEY`,
- czyta `VITE_PUBLIC_APP_ORIGIN`,
- czyta `VITE_CONTACT_EMAIL`,
- waliduje brakujące envy,
- eksportuje `sb`,
- buduje redirecty Auth.

## Baza danych

Migracje SQL są w:

```text
supabase/migrations/
```

Zakres migracji:

- `profiles`
- `trips`
- `reservations`
- `bus_availability`
- `trips_with_seats`
- `public.is_admin()`
- trigger tworzący profil po rejestracji użytkownika
- policies RLS
- `public.create_reservation_atomic(...)`

Uruchomienie migracji:

```bash
supabase link --project-ref TWOJ_PROJECT_REF
supabase db push
```

Alternatywnie możesz wkleić SQL ręcznie w Supabase SQL Editor, po kolei według nazw plików.

## Atomowa rezerwacja

Frontend nie robi już bezpośredniego `insert` do `reservations` przy rezerwowaniu kursu. Używa RPC:

```text
public.create_reservation_atomic(...)
```

Funkcja:

- blokuje wiersz kursu `for update`,
- sprawdza, czy kurs istnieje,
- sprawdza, czy kurs nie jest odwołany,
- liczy zajęte miejsca z `reservations`,
- blokuje przekroczenie `max_seats`,
- zapisuje rezerwację,
- zwraca utworzoną rezerwację.

To jest najważniejsze zabezpieczenie przed sytuacją, w której dwie osoby rezerwują ostatnie miejsce jednocześnie.

## Co zostało zrobione

- Przeniesiono konfigurację Supabase z kodu React do `VITE_*`.
- Dodano `src/lib/supabase.js`.
- Rozbito `src/main.jsx` na moduły:
  - `src/App.jsx`
  - `src/pages/`
  - `src/components/`
  - `src/lib/`
  - `src/data/`
  - `src/hooks/`
- Dodano React Router.
- Dodano ochronę `/admin`.
- Dodano globalny `ErrorBoundary`.
- Dodano loading/error states dla auth, kursów, rezerwacji, dostępności busów i panelu admina.
- Dodano prostą walidację formularzy.
- Zmieniono zapis rezerwacji na RPC `create_reservation_atomic`.
- Dodano SEO w `index.html`.
- Dodano `favicon.svg`, `og-image.svg`, `robots.txt`, `sitemap.xml`.
- Dodano migracje SQL i RLS.
- Dodano `package-lock.json`.
- Dodano `render.yaml`.

## Legacy

Nie usuwać jeszcze plików w root repo:

- `index.html`
- `verify-email.html`
- `reset-password.html`

Są potrzebne, dopóki obecna usługa Render nie zostanie przepięta na `react-app`.

## Kontrola przed produkcją

1. Uzupełnij zmienne środowiskowe w Render.
2. Ustaw Supabase Auth Redirect URLs.
3. Uruchom migracje SQL na właściwym projekcie Supabase.
4. Nadaj wybranemu użytkownikowi `profiles.role = 'admin'`.
5. Zrób test:
   - rejestracja,
   - potwierdzenie emaila,
   - reset hasła,
   - rezerwacja kursu,
   - anulowanie rezerwacji,
   - panel admina,
   - blokada dostępności busa.
6. Po deployu sprawdź bezpośrednie wejście na `/booking`, `/rental`, `/admin`.
