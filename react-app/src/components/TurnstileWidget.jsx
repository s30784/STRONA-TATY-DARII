import React from 'react';

const TURNSTILE_SCRIPT_ID = 'cloudflare-turnstile-script';
const TURNSTILE_SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js';

let turnstileScriptPromise = null;

function loadTurnstileScript() {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  if (turnstileScriptPromise) return turnstileScriptPromise;

  turnstileScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById(TURNSTILE_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.turnstile));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(window.turnstile));
    script.addEventListener('error', reject);
    document.head.appendChild(script);
  });

  return turnstileScriptPromise;
}

export const TurnstileWidget = React.forwardRef(function TurnstileWidget({ onVerify = () => {}, resetKey = 0 }, ref) {
  const containerRef = React.useRef(null);
  const widgetIdRef = React.useRef(null);
  const siteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY || '').trim();

  const resetWidget = React.useCallback(() => {
    onVerify(null);
    if (window.turnstile && widgetIdRef.current !== null) {
      window.turnstile.reset(widgetIdRef.current);
    }
  }, [onVerify]);

  React.useImperativeHandle(ref, () => ({ reset: resetWidget }), [resetWidget]);

  React.useEffect(() => {
    if (!siteKey) {
      if (import.meta.env.DEV) {
        console.warn('VITE_TURNSTILE_SITE_KEY is not set. Turnstile widget will not render.');
      }
      onVerify(null);
      return undefined;
    }

    let cancelled = false;

    loadTurnstileScript()
      .then((turnstile) => {
        if (cancelled || !containerRef.current || !turnstile || widgetIdRef.current !== null) return;
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: siteKey,
          callback: (token) => onVerify(token),
          'expired-callback': () => onVerify(null),
          'error-callback': () => onVerify(null)
        });
      })
      .catch((error) => {
        console.warn('Cloudflare Turnstile script failed to load', error);
        onVerify(null);
      });

    return () => {
      cancelled = true;
      if (window.turnstile && widgetIdRef.current !== null) {
        window.turnstile.remove(widgetIdRef.current);
      }
      widgetIdRef.current = null;
    };
  }, [onVerify, siteKey]);

  React.useEffect(() => {
    if (resetKey > 0) resetWidget();
  }, [resetKey, resetWidget]);

  if (!siteKey) {
    return <div className="turnstile-placeholder">Zabezpieczenie antyspamowe nie jest skonfigurowane.</div>;
  }

  return <div className="turnstile-widget" ref={containerRef} />;
});
