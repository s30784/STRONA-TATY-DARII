import React from 'react';
import { ENV_ERROR, sb } from '../lib/supabase.js';

export function useAuth() {
  const [currentUser, setCurrentUser] = React.useState(null);
  const [currentProfile, setCurrentProfile] = React.useState(null);
  const [authReady, setAuthReady] = React.useState(false);
  const [profileLoading, setProfileLoading] = React.useState(false);
  const [profileError, setProfileError] = React.useState(null);

  const loadProfile = React.useCallback(async (user) => {
    if (!user) {
      setCurrentUser(null);
      setCurrentProfile(null);
      setProfileError(null);
      return;
    }

    setCurrentUser(user);
    setProfileLoading(true);
    setProfileError(null);
    const { data, error } = await sb.from('profiles').select('*').eq('id', user.id).single();
    setProfileLoading(false);

    if (error) {
      setCurrentProfile(null);
      setProfileError(error.message);
      return;
    }

    setCurrentProfile(data || null);
  }, []);

  React.useEffect(() => {
    if (ENV_ERROR || !sb) {
      setAuthReady(true);
      setProfileError(ENV_ERROR || 'Brak konfiguracji Supabase.');
      return undefined;
    }

    let mounted = true;

    sb.auth.getSession().then(async ({ data, error }) => {
      if (!mounted) return;
      if (error) setProfileError(error.message);
      if (data.session) await loadProfile(data.session.user);
      if (mounted) setAuthReady(true);
    });

    const { data: listener } = sb.auth.onAuthStateChange(async (_event, session) => {
      if (session) await loadProfile(session.user);
      else {
        setCurrentUser(null);
        setCurrentProfile(null);
        setProfileError(null);
      }
      setAuthReady(true);
    });

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, [loadProfile]);

  return {
    authReady,
    currentUser,
    currentProfile,
    profileLoading,
    profileError,
    refreshProfile: () => loadProfile(currentUser)
  };
}
