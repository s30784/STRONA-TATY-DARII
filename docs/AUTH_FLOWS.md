# Supabase Auth flows

## Site URL

Production Site URL in Supabase Auth:

```text
https://busyjaroslaw.pl
```

## Redirect URLs

Supabase Auth redirect allowlist should include:

```text
https://busyjaroslaw.pl
https://busyjaroslaw.pl/auth
https://busyjaroslaw.pl/verify-email
https://busyjaroslaw.pl/reset-password
https://busyjaroslaw.pl/my-reservations
https://busyjaroslaw.pl/booking
```

Temporary Render URLs, only while they are still needed:

```text
https://strona-taty-darii.onrender.com
https://strona-taty-darii.onrender.com/auth
https://strona-taty-darii.onrender.com/verify-email
https://strona-taty-darii.onrender.com/reset-password
```

## Password reset

The frontend sends password reset emails from `/auth` with:

```text
supabase.auth.resetPasswordForEmail(email, { redirectTo: `${PUBLIC_APP_ORIGIN}/reset-password` })
```

`PUBLIC_APP_ORIGIN` comes from `VITE_PUBLIC_APP_ORIGIN`, with `window.location.origin` as browser fallback.

The `/reset-password` route handles both Supabase URL variants:

- PKCE query links with `?code=...` using `exchangeCodeForSession(code)`.
- Implicit hash links with `#access_token=...&refresh_token=...&type=recovery`, plus the `PASSWORD_RECOVERY` auth event.

After the recovery session is ready, the page shows the new password form. On submit it calls:

```text
supabase.auth.updateUser({ password })
```

After a successful password change the app signs the user out and shows a link back to `/auth`.

Supabase Auth links are single-use and valid only for a limited time. If a reset link is reused or expires, Supabase can redirect back with URL data such as:

```text
#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired
```

The app parses auth errors from both query string and hash fragments. For `otp_expired`, or descriptions containing `expired` or `invalid`, it shows a readable Polish message and a form for sending a new password reset link. The reset resend form intentionally uses a generic success message and does not reveal whether an account exists for the entered email address.

## Email confirmation

Registration uses:

```text
supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${PUBLIC_APP_ORIGIN}/verify-email`,
    data: { ...profileMetadata }
  }
})
```

The `/verify-email` route handles:

- PKCE query links with `?code=...` using `exchangeCodeForSession(code)`.
- Implicit hash links with `#access_token=...&refresh_token=...`.
- Token hash links with `token_hash` using `verifyOtp`.

The page shows a success or error state and does not immediately redirect away, so the user gets a clear confirmation message.

If the confirmation link is expired or already used, `/verify-email` shows a readable message and lets the user request a new signup confirmation link with:

```text
supabase.auth.resend({
  type: 'signup',
  email,
  options: { emailRedirectTo: `${PUBLIC_APP_ORIGIN}/verify-email` }
})
```

The success message is generic and does not expose account status.

## Noindex routes

Technical routes should stay out of the sitemap and remain `noindex`:

```text
/auth
/verify-email
/reset-password
/my-reservations
/admin
```

## Manual tests after deployment

Password reset:

1. Open `/auth`.
2. Click "Zapomniałem hasła".
3. Enter an existing account email.
4. Open the link from the Supabase email.
5. `/reset-password` should show the new password form.
6. Change the password and confirm the success message.
7. The old password should stop working.
8. The new password should work.

Email confirmation:

1. Register a new test account.
2. Open the confirmation link from the Supabase email.
3. `/verify-email` should show a success message.
4. In Supabase Auth, the user should have `email_confirmed_at`.
5. The confirmed user should be able to submit a ride reservation.

Expired or reused link:

1. Open the same auth link a second time.
2. The app should not crash.
3. The page should show a readable error and a link back to `/auth`.
4. For password reset, the page should allow sending a new reset link.

## Reset password email template

Recommended Supabase Reset password template text:

```html
<h2>Ustaw nowe hasło</h2>

<p>Otrzymaliśmy prośbę o zmianę hasła do konta Busy Jarosław.</p>

<p>Kliknij poniższy link, aby ustawić nowe hasło:</p>

<p>
  <a href="{{ .ConfirmationURL }}">Ustaw nowe hasło</a>
</p>

<p>Link jest jednorazowy i ważny przez ograniczony czas. Jeśli link nie działa, wróć na stronę logowania i wyślij nowy link resetujący.</p>

<p>Jeśli to nie Ty wysłałeś tę prośbę, możesz zignorować tę wiadomość.</p>

<p>Busy Jarosław</p>
```
