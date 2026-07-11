import React from 'react';
import { Link } from 'react-router-dom';
import { parseAuthUrlParams, isExpiredAuthUrlError } from '../lib/authUrl.js';
import { sb } from '../lib/supabase.js';
import { AuthLinkErrorPage } from './AuthLinkErrorPage.jsx';

function clearRecoveryUrl() {
  window.history.replaceState({}, document.title, '/reset-password');
}

function invalidRecoveryMessage(error) {
  const text = String(error?.message || error || '').trim();
  if (!text) return 'Link do resetu hasła jest nieprawidłowy albo wygasł.';
  return text;
}

export function ResetPasswordPage() {
  const [state, setState] = React.useState({
    status: 'loading',
    message: 'Sprawdzamy link resetu hasła...',
    authError: null
  });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    let mounted = true;
    let recoveryEventSeen = false;

    function markReady() {
      if (!mounted) return;
      setState({ status: 'ready', message: null });
      clearRecoveryUrl();
    }

    function markInvalid(error, authError = null) {
      if (!mounted) return;
      setState({ status: 'invalid', message: invalidRecoveryMessage(error), authError });
      clearRecoveryUrl();
    }

    const { data: listener } = sb.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        recoveryEventSeen = true;
        markReady();
      }
    });

    async function prepareRecoverySession() {
      const params = parseAuthUrlParams();
      try {
        if (isExpiredAuthUrlError(params.authError)) {
          markInvalid(null, params.authError);
          return;
        }
        if (params.authError) throw new Error(params.authError.errorDescription || params.authError.error || 'Nie udało się obsłużyć linku resetu hasła.');
        if (params.type && params.type !== 'recovery') throw new Error('Ten link nie jest linkiem do resetowania hasła.');

        if (params.code) {
          const { error } = await sb.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
          markReady();
          return;
        }

        if (params.accessToken && params.refreshToken) {
          const { error } = await sb.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken
          });
          if (error) throw error;
          markReady();
          return;
        }

        window.setTimeout(() => {
          if (mounted && !recoveryEventSeen) markInvalid();
        }, 800);
      } catch (error) {
        markInvalid(error);
      }
    }

    prepareRecoverySession();

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  async function onSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const password = String(form.get('password') || '');
    const repeat = String(form.get('repeat') || '');

    if (password.length < 8) {
      setState({ status: 'ready', message: 'Hasło musi mieć co najmniej 8 znaków.' });
      return;
    }
    if (password !== repeat) {
      setState({ status: 'ready', message: 'Hasła muszą być identyczne.' });
      return;
    }

    setSaving(true);
    const { error } = await sb.auth.updateUser({ password });
    setSaving(false);
    if (error) {
      setState({ status: 'ready', message: `Nie udało się zmienić hasła: ${error.message}` });
      return;
    }

    await sb.auth.signOut();
    setState({ status: 'success', message: 'Hasło zostało zmienione. Możesz się teraz zalogować.' });
  }

  const showForm = state.status === 'ready';
  const showLoading = state.status === 'loading';
  const showInvalid = state.status === 'invalid';
  const showSuccess = state.status === 'success';

  if (showInvalid) return <AuthLinkErrorPage mode="reset" authError={state.authError} />;

  return (
    <main className="auth-redirect">
      <div className="card">
        <h1>Ustaw nowe hasło</h1>
        {showLoading ? <p>Sprawdzamy link resetu hasła...</p> : <p>Wpisz nowe hasło do swojego konta Busy Jarosław.</p>}
        {state.message && !showLoading ? <div className={`msg ${showSuccess ? 'ok' : 'err'}`}>{state.message}</div> : null}
        {showForm ? (
          <form onSubmit={onSubmit}>
            <div className="fg"><label>Nowe hasło</label><input type="password" name="password" minLength="8" autoComplete="new-password" /></div>
            <div className="fg"><label>Powtórz nowe hasło</label><input type="password" name="repeat" minLength="8" autoComplete="new-password" /></div>
            <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Zmieniam hasło...' : 'Zmień hasło'}</button>
          </form>
        ) : null}
        {!showLoading ? <Link className="btn-outline mt-sm" to="/auth">Wróć do logowania</Link> : null}
      </div>
    </main>
  );
}
