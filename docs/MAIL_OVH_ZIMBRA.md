# Mail OVH Zimbra

## Aktywny Mail

Publiczny adres kontaktowy:

```text
kontakt@busyjaroslaw.pl
```

## Provider

OVH Zimbra Starter.

## Webmail

```text
https://webmail.mail.ovh.net/
```

## Dane Publiczne Na Stronie

```text
email: kontakt@busyjaroslaw.pl
tel: 663 063 364
www: https://busyjaroslaw.pl
```

## Render Env

```bash
VITE_CONTACT_EMAIL=kontakt@busyjaroslaw.pl
```

`VITE_CONTACT_EMAIL` jest publiczną zmienną frontendu. Aplikacja ma też fallback na `kontakt@busyjaroslaw.pl`, gdy env nie jest ustawiony lokalnie.

## Bezpieczeństwo

Hasła do poczty nie trzymamy w repozytorium. Nie wpisujemy loginów ani haseł do kodu, dokumentacji, `.env.example` ani commitów. Do repo nie trafiają żadne sekrety pocztowe.

## TODO Techniczne Poza Kodem

- Sprawdzić SPF.
- Sprawdzić DKIM.
- Dodać albo zweryfikować DMARC.
- Później podpiąć powiadomienia ze strony na `kontakt@busyjaroslaw.pl`.
