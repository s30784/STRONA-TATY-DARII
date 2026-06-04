import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { sb } from '../lib/supabase.js';

function getUrlParams() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return {
    accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
    type: hashParams.get('type') || queryParams.get('type'),
    error: hashParams.get('error_description') || queryParams.get('error_description')
  };
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState(null);

  React.useEffect(() => {
    async function prepareRecoverySession() {
      try {
        const params = getUrlParams();
        if (params.error) throw new Error(params.error);
        if (params.type && params.type !== 'recovery') throw new Error('Ten link nie jest linkiem do resetowania hasła.');
        if (params.accessToken && params.refreshToken) {
          const { error } = await sb.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken
          });
          if (error) throw error;
        }
        const { data: { session } } = await sb.auth.getSession();
        if (!session) throw new Error('Link wygasł albo jest nieprawidłowy. Poproś o nowy reset hasła.');
        setReady(true);
      } catch (err) {
        setMessage({ type: 'err', text: err.message || 'Spróbuj ponownie wysłać link resetujący.' });
      }
    }

    prepareRecoverySession();
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const repeat = String(form.get('repeat') || '');

    if (password.length < 6) {
      setMessage({ type: 'err', text: 'Hasło musi mieć co najmniej 6 znaków.' });
      return;
    }
    if (password !== repeat) {
      setMessage({ type: 'err', text: 'Hasła muszą być takie same.' });
      return;
    }

    setLoading(true);
    const { error } = await sb.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setMessage({ type: 'err', text: `Nie udało się zmienić hasła: ${error.message}` });
      return;
    }

    await sb.auth.signOut();
    setMessage({ type: 'ok', text: 'Hasło zostało zapisane. Możesz zalogować się nowym hasłem.' });
    window.setTimeout(() => navigate('/auth'), 1600);
  }

  return (
    <main className="auth-redirect">
      <div className="card">
        <h1>Ustaw nowe hasło</h1>
        <p>Wpisz nowe hasło do swojego konta.</p>
        {message ? <div className={`msg ${message.type}`}>{message.text}</div> : null}
        {ready ? (
          <form onSubmit={onSubmit}>
            <div className="fg"><label>Nowe hasło</label><input type="password" name="password" minLength="6" autoComplete="new-password" /></div>
            <div className="fg"><label>Powtórz hasło</label><input type="password" name="repeat" minLength="6" autoComplete="new-password" /></div>
            <button className="btn-primary" type="submit" disabled={loading}>{loading ? 'Zapisuję...' : 'Zapisz nowe hasło'}</button>
          </form>
        ) : (
          <Link className="btn-outline" to="/auth">Wróć do logowania</Link>
        )}
      </div>
    </main>
  );
}
