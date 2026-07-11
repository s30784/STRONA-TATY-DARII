import React from 'react';
import { Link } from 'react-router-dom';
import { sb } from '../lib/supabase.js';

function authUrlParams() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return {
    code: queryParams.get('code'),
    type: hashParams.get('type') || queryParams.get('type') || 'signup',
    tokenHash: hashParams.get('token_hash') || queryParams.get('token_hash'),
    email: hashParams.get('email') || queryParams.get('email'),
    accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
    error: hashParams.get('error_description') || queryParams.get('error_description') || hashParams.get('error') || queryParams.get('error')
  };
}

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
    text: 'Potwierdzamy adres email...'
  });

  React.useEffect(() => {
    let mounted = true;

    function setSafe(nextState) {
      if (mounted) setState(nextState);
    }

    async function verifyEmail() {
      const params = authUrlParams();
      try {
        if (params.error) throw new Error(params.error);

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
            type: params.type,
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
