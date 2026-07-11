import { createClient } from '@supabase/supabase-js';

const DEFAULT_CONTACT_EMAIL = 'kontakt@busyjaroslaw.pl';

function readEnv(name) {
  return String(import.meta.env[name] || '').trim();
}

function publicContactEmail(value) {
  const email = String(value || '').trim().toLowerCase();
  return email === DEFAULT_CONTACT_EMAIL ? email : DEFAULT_CONTACT_EMAIL;
}

const env = {
  VITE_SUPABASE_URL: readEnv('VITE_SUPABASE_URL'),
  VITE_SUPABASE_PUBLISHABLE_KEY: readEnv('VITE_SUPABASE_PUBLISHABLE_KEY'),
  VITE_PUBLIC_APP_ORIGIN: readEnv('VITE_PUBLIC_APP_ORIGIN'),
  VITE_CONTACT_EMAIL: readEnv('VITE_CONTACT_EMAIL')
};

const requiredEnv = {
  VITE_SUPABASE_URL: env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: env.VITE_SUPABASE_PUBLISHABLE_KEY
};

const missing = Object.entries(requiredEnv)
  .filter(([, value]) => !value)
  .map(([name]) => name);

export const ENV_ERROR = missing.length
  ? `Brak wymaganych zmiennych środowiskowych: ${missing.join(', ')}`
  : '';

if (missing.length) {
  console.error(ENV_ERROR);
}

function normalizeOrigin(origin) {
  return String(origin || '').trim().replace(/\/+$/, '');
}

const isBrowser = typeof window !== 'undefined';
const fallbackOrigin = isBrowser ? window.location.origin : 'https://busyjaroslaw.pl';

export const PUBLIC_APP_ORIGIN = normalizeOrigin(env.VITE_PUBLIC_APP_ORIGIN || fallbackOrigin);
export const CONTACT_EMAIL = publicContactEmail(env.VITE_CONTACT_EMAIL);
export const APP_ORIGIN = PUBLIC_APP_ORIGIN || fallbackOrigin;

export const AUTH_REDIRECTS = {
  verifyEmail: `${APP_ORIGIN}/verify-email`,
  resetPassword: `${APP_ORIGIN}/reset-password`
};

export const sb = ENV_ERROR ? null : createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_PUBLISHABLE_KEY);
