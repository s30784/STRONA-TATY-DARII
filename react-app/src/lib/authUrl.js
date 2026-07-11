function paramsFrom(value) {
  return new URLSearchParams(String(value || '').replace(/^#/, '').replace(/^\?/, ''));
}

function sourceSearch(source) {
  if (source?.search != null) return source.search;
  if (typeof window === 'undefined') return '';
  return window.location.search;
}

function sourceHash(source) {
  if (source?.hash != null) return source.hash;
  if (typeof window === 'undefined') return '';
  return window.location.hash;
}

function firstParam(queryParams, hashParams, key) {
  return hashParams.get(key) || queryParams.get(key);
}

export function parseAuthUrlError(source) {
  const queryParams = paramsFrom(sourceSearch(source));
  const hashParams = paramsFrom(sourceHash(source));
  const error = firstParam(queryParams, hashParams, 'error');
  const errorCode = firstParam(queryParams, hashParams, 'error_code');
  const errorDescription = firstParam(queryParams, hashParams, 'error_description');

  if (!error && !errorCode && !errorDescription) return null;
  return { error, errorCode, errorDescription };
}

export function isExpiredAuthUrlError(authError) {
  if (!authError) return false;
  const code = String(authError.errorCode || '').toLowerCase();
  const description = String(authError.errorDescription || '').toLowerCase();
  return code === 'otp_expired' || description.includes('expired') || description.includes('invalid');
}

export function parseAuthUrlParams(source) {
  const queryParams = paramsFrom(sourceSearch(source));
  const hashParams = paramsFrom(sourceHash(source));
  const authError = parseAuthUrlError(source);

  return {
    code: queryParams.get('code'),
    type: firstParam(queryParams, hashParams, 'type'),
    tokenHash: firstParam(queryParams, hashParams, 'token_hash'),
    email: firstParam(queryParams, hashParams, 'email'),
    accessToken: firstParam(queryParams, hashParams, 'access_token'),
    refreshToken: firstParam(queryParams, hashParams, 'refresh_token'),
    authError
  };
}
