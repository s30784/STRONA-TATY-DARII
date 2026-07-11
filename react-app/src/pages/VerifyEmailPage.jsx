import React from 'react';
import { Link } from 'react-router-dom';
import { parseAuthUrlParams, isExpiredAuthUrlError } from '../lib/authUrl.js';
import { sb } from '../lib/supabase.js';
import { AuthLinkErrorPage } from './AuthLinkErrorPage.jsx';

function clearVerifyUrl() {
  window.history.replaceState({}, document.title, '/verify-email');
}

function verifyErrorMessage(error) {
  const text = String(error?.message || error || '').trim();
  if (!text) return 'Nie udało się potwierdzić adresu email. Link mógł wygasnąć albo zostać już użyty.';
  return text;
}

export function VerifyEmailPage() {
  const [state, setState] = React.useState({
    type: 'loading',
    title: 'Potwierdzamy adres email...',
    text: 'Potwierdzamy adres email...',
    authError: null
  });

  React.useEffect(() => {
    let mounted = true;

    function setSafe(nextState) {
      if (mounted) setState(nextState);
    }

    async function verifyEmail() {
      const params = parseAuthUrlParams();
      try {
        if (isExpiredAuthUrlError(params.authError)) {
          clearVerifyUrl();
          setSafe({
            type: 'expired',
            title: 'Link potwierdzający email jest nieważny albo wygasł.',
            text: 'Spróbuj zalogować się lub wyślij link ponownie.',
            authError: params.authError
          });
          return;
        }

        if (params.authError) throw new Error(params.authError.errorDescription || params.authError.error || 'Nie udało się potwierdzić adresu email.');

        if (params.code) {
          const { error } = await sb.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
          clearVerifyUrl();
          setSafe({ type: 'success', title: 'Adres email został potwierdzony.', text: 'Adres email został potwierdzony. Możesz teraz zarezerwować przejazd.' });
          return;
        }

        if (params.accessToken && params.refreshToken) {
          const { error } = await sb.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken
          });
          if (error) throw error;
          clearVerifyUrl();
          setSafe({ type: 'success', title: 'Adres email został potwierdzony.', text: 'Adres email został potwierdzony. Możesz teraz zarezerwować przejazd.' });
          return;
        }

        if (params.tokenHash) {
          const { error } = await sb.auth.verifyOtp({
            type: params.type || 'signup',
            token_hash: params.tokenHash,
            email: params.email || undefined
          });
          if (error) throw error;
          clearVerifyUrl();
          setSafe({ type: 'success', title: 'Adres email został potwierdzony.', text: 'Adres email został potwierdzony. Możesz teraz zarezerwować przejazd.' });
          return;
        }

        throw new Error('Brak tokenu potwierdzającego w adresie.');
      } catch (error) {
        clearVerifyUrl();
        setSafe({
          type: 'error',
          title: 'Nie udało się potwierdzić adresu email.',
          text: verifyErrorMessage(error)
        });
      }
    }

    verifyEmail();

    return () => {
      mounted = false;
    };
  }, []);

  if (state.type === 'expired') return <AuthLinkErrorPage mode="verify" authError={state.authError} />;

  return (
    <main className="auth-redirect">
      <div className="card">
        <div className="icon">{state.type === 'loading' ? '...' : state.type === 'success' ? 'OK' : '!'}</div>
        <h1>{state.title}</h1>
        <p>{state.text}</p>
        {state.type === 'success' ? (
          <div className="auth-action-grid">
            <Link className="btn-primary" to="/booking">Przejdź do rezerwacji</Link>
            <Link className="btn-outline" to="/my-reservations">Moje rezerwacje</Link>
            <Link className="btn-outline" to="/auth">Przejdź do logowania</Link>
          </div>
        ) : null}
        {state.type === 'error' ? <Link className="btn-primary" to="/auth">Przejdź do logowania</Link> : null}
      </div>
    </main>
  );
}
