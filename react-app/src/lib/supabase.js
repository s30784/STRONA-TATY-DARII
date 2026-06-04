import { createClient } from '@supabase/supabase-js';

function readEnv(name) {
  return String(import.meta.env[name] || '').trim();
}

const env = {
  VITE_SUPABASE_URL: readEnv('VITE_SUPABASE_URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: readEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  VITE_PUBLIC_APP_ORIGIN: readEnv('VITE_PUBLIC_APP_ORIGIN'),
  VITE_CONTACT_EMAIL: readEnv('VITE_CONTACT_EMAIL')
};

const missing = Object.entries(env)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const ENV_ERROR = missing.length
  ? `Brak wymaganych zmiennych środowiskowych: ${missing.join(', ')}`
  : '';

if (missing.length) {
  console.error(ENV_ERROR);
}

function normalizeOrigin(origin) {
  return origin.replace(/\/+$/, '');
}

const isBrowser = typeof window !== 'undefined';
const currentHost = isBrowser ? window.location.hostname : '';

export const PUBLIC_APP_ORIGIN = normalizeOrigin(env.VITE_PUBLIC_APP_ORIGIN);
export const CONTACT_EMAIL = env.VITE_CONTACT_EMAIL;
export const APP_ORIGIN = isBrowser && (currentHost === 'localhost' || currentHost === '127.0.0.1')
  ? PUBLIC_APP_ORIGIN
  : isBrowser
    ? window.location.origin
    : PUBLIC_APP_ORIGIN;

export const AUTH_REDIRECTS = {
  verifyEmail: `${APP_ORIGIN}/verify-email.html`,
  resetPassword: `${APP_ORIGIN}/reset-password.html`
};

export const sb = ENV_ERROR ? null : createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
