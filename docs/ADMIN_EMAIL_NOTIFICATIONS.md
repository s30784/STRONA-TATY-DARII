# Powiadomienia Email Admina

## Kiedy Admin Dostaje Maila

Mail do admina jest wysylany po udanym zapisie zapytania w bazie:

- nowe zapytanie `/rental`,
- nowe zapytanie `/tow`.

Nie wysylamy jeszcze automatycznych maili do klientow.

## Odbiorca

```text
kontakt@busyjaroslaw.pl
```

## Nadawca Techniczny

```text
Busy Jarosław <powiadomienia@busyjaroslaw.pl>
```

## Provider Techniczny

Resend.

## Rola OVH Zimbra

OVH Zimbra sluzy do:

- odbioru maili na `kontakt@busyjaroslaw.pl`,
- recznego odpisywania klientom.

## Wymagane Supabase Edge Secrets

```bash
RESEND_API_KEY=
ADMIN_NOTIFICATION_EMAIL=
MAIL_FROM=
```

Docelowe wartosci konfiguracyjne:

```text
ADMIN_NOTIFICATION_EMAIL=kontakt@busyjaroslaw.pl
MAIL_FROM=Busy Jarosław <powiadomienia@busyjaroslaw.pl>
```

`RESEND_API_KEY` jest sekretem i nie moze trafic do repozytorium.

## Bezpieczenstwo

- Resend API key nie moze byc w React.
- `MAIL_FROM` i `ADMIN_NOTIFICATION_EMAIL` nie musza byc w React.
- Nie trzymamy sekretow w repozytorium.
- Nie logujemy prawdziwych sekretow.

## Zachowanie Po Bledzie Resend

Mail jest wysylany dopiero po udanym zapisie requestu w bazie. Jezeli Resend zwroci blad albo brakuje konfiguracji, zapis requestu nie jest cofany, klient nadal widzi sukces, a blad trafia tylko do logow Edge Function.

## Testy Produkcyjne

- Wyslac formularz `/rental`.
- Sprawdzic, czy request jest widoczny w panelu admina.
- Sprawdzic mail na `kontakt@busyjaroslaw.pl`.
- Wyslac formularz `/tow`.
- Sprawdzic, czy request jest widoczny w panelu admina.
- Sprawdzic mail na `kontakt@busyjaroslaw.pl`.
