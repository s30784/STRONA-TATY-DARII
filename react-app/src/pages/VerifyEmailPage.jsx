import React from 'react';
import { Link } from 'react-router-dom';
import { sb } from '../lib/supabase.js';

function getAuthParams() {
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  const queryParams = new URLSearchParams(window.location.search);
  return {
    type: hashParams.get('type') || queryParams.get('type') || 'email',
    tokenHash: hashParams.get('token_hash') || queryParams.get('token_hash'),
    email: hashParams.get('email') || queryParams.get('email'),
    accessToken: hashParams.get('access_token') || queryParams.get('access_token'),
    refreshToken: hashParams.get('refresh_token') || queryParams.get('refresh_token'),
    error: hashParams.get('error_description') || queryParams.get('error_description')
  };
}

export function VerifyEmailPage() {
  const [state, setState] = React.useState({ type: 'loading', title: 'Potwierdzanie emaila...', text: 'Czekaj, weryfikuję Twój adres email.' });

  React.useEffect(() => {
    async function verifyEmail() {
      try {
        const params = getAuthParams();
        if (params.error) throw new Error(params.error);

        if (params.accessToken && params.refreshToken) {
          const { error } = await sb.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken
          });
          if (error) throw error;
        } else {
          if (!params.tokenHash) {
            throw new Error('Brak tokenu weryfikacyjnego w URL. Sprawdź link z emaila.');
          }
          const { error } = await sb.auth.verifyOtp({
            type: params.type,
            token_hash: params.tokenHash,
            email: params.email || undefined
          });
          if (error) throw error;
        }

        setState({ type: 'success', title: 'Email potwierdzony', text: 'Adres email został potwierdzony. Możesz wrócić do strony i zalogować się na konto.' });
      } catch (err) {
        setState({ type: 'error', title: 'Błąd weryfikacji', text: err.message || 'Nie udało się potwierdzić emaila.' });
      }
    }

    verifyEmail();
  }, []);

  return (
    <main className="auth-redirect">
      <div className="card">
        <div className="icon">{state.type === 'loading' ? '...' : state.type === 'success' ? 'OK' : '!'}</div>
        <h1>{state.title}</h1>
        <p>{state.text}</p>
        <Link className="btn-primary" to="/auth">Przejdź do logowania</Link>
      </div>
    </main>
  );
}
