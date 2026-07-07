# Antyspam Turnstile

## Co Chronimy

Zabezpieczenie antyspamowe obejmuje publiczne formularze:

- `/rental` - zapytanie o wynajem busa.
- `/tow` - zapytanie o lawetę.

Formularz rezerwacji przejazdów, panel admina, statusy i przepływy płatności nie są objęte tą zmianą.

## Przepływ

1. Frontend renderuje Cloudflare Turnstile i pobiera token.
2. Formularz wysyła dane do Supabase Edge Function razem z tokenem.
3. Edge Function weryfikuje token przez Cloudflare Siteverify.
4. Edge Function sprawdza prosty rate limit po znormalizowanym emailu i telefonie.
5. Edge Function wywołuje istniejące RPC:
   - `create_rental_request`,
   - `create_tow_request`.
6. RPC zapisuje rekord w `rental_requests` albo `tow_requests` i tworzy `notification_events`.

## Env Frontendu

Render frontend używa publicznej zmiennej:

```bash
VITE_TURNSTILE_SITE_KEY=
```

To jest publiczny site key Cloudflare Turnstile. Może być użyty w React, ale sam nie wystarcza do walidacji po stronie serwera.

## Sekrety Supabase Edge Functions

Supabase Edge Functions używają sekretów:

```bash
TURNSTILE_SECRET_KEY=
EDGE_SUPABASE_URL=
EDGE_SUPABASE_SERVICE_ROLE_KEY=
```

`TURNSTILE_SECRET_KEY` i `EDGE_SUPABASE_SERVICE_ROLE_KEY` nie mogą trafić do Reacta, bo kod frontendu jest publiczny w przeglądarce. Secret key służy do serwerowego potwierdzenia tokena Turnstile, a service role key daje podwyższone uprawnienia do bazy.

## Edge Functions

Funkcje:

- `submit-rental-request`
- `submit-tow-request`

Obie funkcje:

- obsługują CORS i `OPTIONS`,
- akceptują tylko `POST`,
- wymagają tokena Turnstile,
- walidują wymagane pola,
- sprawdzają Cloudflare Siteverify,
- limitują zapytania do 3 na godzinę i 10 na 24 godziny dla tego samego emaila lub telefonu,
- wywołują istniejące RPC dopiero po pozytywnej walidacji.

## Deploy

```bash
supabase functions deploy submit-rental-request
supabase functions deploy submit-tow-request
```

Po deployu upewnij się, że sekrety Edge Functions są ustawione w Supabase.

## Testy Manualne

- Bez tokena Turnstile formularz nie wysyła zapytania i pokazuje komunikat: `Potwierdź, że nie jesteś robotem.`
- Z poprawnym tokenem `/rental` zapisuje rekord w `rental_requests`.
- Z poprawnym tokenem `/tow` zapisuje rekord w `tow_requests`.
- Po przekroczeniu limitu funkcja zwraca HTTP 429 i komunikat o zbyt wielu zapytaniach.
- Admin widzi nowe zapytania w panelu.
- `notification_events` dalej powstają po zapisaniu zapytania.

## TODO

- Po pełnym przejściu na Edge Functions można rozważyć ograniczenie bezpośredniego publicznego wykonywania `create_rental_request` i `create_tow_request`.
