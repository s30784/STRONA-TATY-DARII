import React from 'react';
import { Link } from 'react-router-dom';
import { AUTH_REDIRECTS, sb } from '../lib/supabase.js';
import { validateEmail } from '../lib/validation.js';

export function AuthLinkErrorPage({ mode = 'generic', authError, onAction }) {
  const [message, setMessage] = React.useState(null);
  const [loading, setLoading] = React.useState(false);
  const isVerify = mode === 'verify';
  const title = isVerify ? 'Link potwierdzający email jest nieważny albo wygasł' : 'Link jest nieważny albo wygasł';
  const description = isVerify
    ? 'Link potwierdzający email jest jednorazowy i ważny tylko przez ograniczony czas. Jeśli został już użyty albo minął czas ważności, wróć do logowania lub wyślij link ponownie.'
    : 'Link do resetu hasła lub potwierdzenia emaila jest jednorazowy i ważny tylko przez ograniczony czas. Jeśli został już użyty albo minął czas ważności, wyślij nowy link.';
  const hasAuthError = Boolean(authError);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get('email') || '').trim();
    const emailError = validateEmail(email);
    if (emailError) {
      setMessage({ type: 'err', text: emailError });
      return;
    }

    setLoading(true);
    const result = isVerify
      ? await sb.auth.resend({
          type: 'signup',
          email,
          options: { emailRedirectTo: AUTH_REDIRECTS.verifyEmail }
        })
      : await sb.auth.resetPasswordForEmail(email, { redirectTo: AUTH_REDIRECTS.resetPassword });
    setLoading(false);

    if (result.error) {
      setMessage({ type: 'err', text: `Nie udało się wysłać linku: ${result.error.message}` });
      return;
    }

    onAction?.();
    setMessage({
      type: 'ok',
      text: isVerify
        ? 'Jeśli konto z tym adresem oczekuje na potwierdzenie, wysłaliśmy nowy link.'
        : 'Jeśli konto z tym adresem istnieje, wysłaliśmy nowy link resetu hasła. Sprawdź skrzynkę email.'
    });
    event.currentTarget.reset();
  }

  return (
    <main className="auth-redirect">
      <div className="card">
        <div className="icon">!</div>
        <h1>{title}</h1>
        <p>{description}</p>
        {hasAuthError ? <p className="form-help">Możesz wysłać nowy link albo wrócić do logowania.</p> : null}
        {message ? <div className={`msg ${message.type}`}>{message.text}</div> : null}
        <form className="auth-link-error-form" onSubmit={onSubmit}>
          <div className="fg"><label>Email</label><input type="email" name="email" autoComplete="email" /></div>
          <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Wysyłam...' : isVerify ? 'Wyślij nowy link potwierdzający' : 'Wyślij nowy link resetu hasła'}</button>
        </form>
        <Link className="btn-outline mt-sm" to="/auth" onClick={() => onAction?.()}>Wróć do logowania</Link>
      </div>
    </main>
  );
}
