import React from 'react';

const FALLBACK_ORIGIN = 'https://strona-taty-darii.onrender.com';
const SITE_NAME = 'Wynajem Busów Jarosław';
const DEFAULT_IMAGE_PATH = '/og-image.svg';
const CONTACT_PHONE_E164 = '+48663063364';

const PUBLIC_SEO = {
  '/': {
    title: 'Transport Jarosław i Podkarpacie | Busy, wynajem busa i laweta',
    description: 'Przejazdy Jarosław - Wiedeń, wynajem busa oraz laweta i transport pojazdów z Podkarpacia. Sprawdź terminy, wyślij zapytanie lub zadzwoń: 663 063 364.'
  },
  '/booking': {
    title: 'Busy Jarosław - Wiedeń | Rezerwacja przejazdu',
    description: 'Zarezerwuj przejazd busem na trasie Jarosław - Wiedeń lub Wiedeń - Jarosław. Sprawdź dostępne terminy, cenę i wolne miejsca.'
  },
  '/rental': {
    title: 'Wynajem busa Jarosław | Bus do wynajęcia Podkarpacie',
    description: 'Wynajem busa w Jarosławiu i okolicy. Wybierz termin, wyślij zapytanie i ustal szczegóły wynajmu. Obsługa klientów z Podkarpacia.'
  },
  '/tow': {
    title: 'Laweta Jarosław | Transport pojazdów i towarów Podkarpacie',
    description: 'Laweta Jarosław i Podkarpacie. Transport pojazdów, maszyn oraz wybranych towarów. Opisz trasę i ładunek, a potwierdzimy szczegóły transportu.'
  },
  '/contact': {
    title: 'Kontakt | Transport Jarosław, wynajem busa i laweta',
    description: 'Skontaktuj się w sprawie przejazdu Jarosław - Wiedeń, wynajmu busa, lawety lub transportu. Telefon: 663 063 364.'
  }
};

const PRIVATE_PATHS = ['/admin', '/auth', '/login', '/my-reservations', '/reset-password', '/verify-email'];

function normalizeOrigin(value) {
  return String(value || FALLBACK_ORIGIN).trim().replace(/\/+$/, '') || FALLBACK_ORIGIN;
}

function normalizePath(pathname) {
  const path = String(pathname || '/').split('?')[0].split('#')[0].replace(/\/+$/, '');
  return path || '/';
}

function baseUrl() {
  return normalizeOrigin(import.meta.env.VITE_PUBLIC_APP_ORIGIN);
}

function canonicalFor(pathname) {
  const path = normalizePath(pathname);
  return path === '/' ? `${baseUrl()}/` : `${baseUrl()}${path}`;
}

function isPrivatePath(pathname) {
  const path = normalizePath(pathname);
  return PRIVATE_PATHS.some((privatePath) => path === privatePath || path.startsWith(`${privatePath}/`));
}

function routeSeo(pathname) {
  const path = normalizePath(pathname);
  const publicSeo = PUBLIC_SEO[path];
  if (publicSeo) {
    return { ...publicSeo, robots: 'index,follow', url: canonicalFor(path) };
  }
  return {
    title: `${SITE_NAME} | Panel klienta`,
    description: 'Panel techniczny i konto klienta.',
    robots: isPrivatePath(path) ? 'noindex,nofollow' : 'noindex,nofollow',
    url: canonicalFor(path)
  };
}

function ensureMeta(attribute, key) {
  const selector = `meta[${attribute}="${key}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  return tag;
}

function setMetaName(name, content) {
  ensureMeta('name', name).setAttribute('content', content);
}

function setMetaProperty(property, content) {
  ensureMeta('property', property).setAttribute('content', content);
}

function setCanonical(url) {
  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement('link');
    link.setAttribute('rel', 'canonical');
    document.head.appendChild(link);
  }
  link.setAttribute('href', url);
}

function setStructuredData(data) {
  const id = 'route-structured-data';
  let script = document.getElementById(id);
  if (!data) {
    script?.remove();
    return;
  }
  if (!script) {
    script = document.createElement('script');
    script.id = id;
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function place(name) {
  return { '@type': 'Place', name };
}

function service(name, url, serviceType) {
  return {
    '@type': 'Service',
    name,
    serviceType,
    provider: { '@id': `${baseUrl()}/#business` },
    areaServed: ['Jarosław', 'Podkarpacie', 'Wiedeń', 'Austria'].map(place),
    url
  };
}

function structuredData(contactEmail) {
  const url = `${baseUrl()}/`;
  const email = String(contactEmail || import.meta.env.VITE_CONTACT_EMAIL || '').trim();
  const services = [
    service('Przewóz osób Jarosław - Wiedeń', `${baseUrl()}/booking`, 'Przewóz osób Jarosław - Wiedeń'),
    service('Wynajem busa', `${baseUrl()}/rental`, 'Wynajem busa'),
    service('Laweta i transport pojazdów', `${baseUrl()}/tow`, 'Laweta i transport pojazdów'),
    service('Transport wybranych towarów', `${baseUrl()}/tow`, 'Transport wybranych towarów')
  ];
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'ProfessionalService',
        '@id': `${baseUrl()}/#business`,
        name: SITE_NAME,
        url,
        telephone: CONTACT_PHONE_E164,
        email: email || undefined,
        areaServed: ['Jarosław', 'Podkarpacie', 'Wiedeń', 'Austria'].map(place),
        serviceType: services.map((item) => item.serviceType),
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Usługi transportowe',
          itemListElement: services.map((item) => ({
            '@type': 'Offer',
            itemOffered: item
          }))
        }
      },
      ...services
    ]
  };
}

export function Seo({ pathname, contactEmail }) {
  React.useEffect(() => {
    const seo = routeSeo(pathname);
    const publicPage = PUBLIC_SEO[normalizePath(pathname)];
    const imageUrl = `${baseUrl()}${DEFAULT_IMAGE_PATH}`;

    document.title = seo.title;
    setMetaName('description', seo.description);
    setMetaName('robots', seo.robots);
    setCanonical(seo.url);
    setMetaProperty('og:site_name', SITE_NAME);
    setMetaProperty('og:title', seo.title);
    setMetaProperty('og:description', seo.description);
    setMetaProperty('og:url', seo.url);
    setMetaProperty('og:type', 'website');
    setMetaProperty('og:image', imageUrl);
    setMetaName('twitter:card', 'summary_large_image');
    setMetaName('twitter:title', seo.title);
    setMetaName('twitter:description', seo.description);
    setMetaName('twitter:image', imageUrl);
    setStructuredData(publicPage ? structuredData(contactEmail) : null);
  }, [pathname, contactEmail]);

  return null;
}

// TODO: Docelowo można rozważyć prerender publicznych tras dla SEO.
