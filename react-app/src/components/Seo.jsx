import React from 'react';
import { LANDING_PAGES } from '../data/landingPages.js';

const FALLBACK_ORIGIN = 'https://busyjaroslaw.pl';
const FALLBACK_CONTACT_EMAIL = 'kontakt@busyjaroslaw.pl';
const SITE_NAME = 'Busy Jarosław';
const DEFAULT_IMAGE_PATH = '/og-image.svg';
const CONTACT_PHONE_E164 = '+48663063364';

const PUBLIC_SEO = {
  '/': {
    title: 'Busy Jarosław | Busy Jarosław Wiedeń, wynajem busa i laweta',
    description: 'Przejazdy Jarosław Wiedeń, wynajem busa oraz laweta w Jarosławiu i na Podkarpaciu. Sprawdź ofertę Busy Jarosław i skontaktuj się z nami.'
  },
  '/booking': {
    title: 'Busy Jarosław Wiedeń | Rezerwacja przejazdu',
    description: 'Zarezerwuj przejazd na trasie Jarosław Wiedeń lub Wiedeń Jarosław. Sprawdź terminy, wolne miejsca i cenę przejazdu.'
  },
  '/rental': {
    title: 'Wynajem busa Jarosław | Busy Jarosław',
    description: 'Wynajem busa w Jarosławiu i na Podkarpaciu. Busy na wyjazdy rodzinne, firmowe, transfery, delegacje i trasy indywidualne.'
  },
  '/tow': {
    title: 'Laweta Jarosław | Transport pojazdów i pomoc drogowa',
    description: 'Laweta Jarosław i transport pojazdów na Podkarpaciu. Wycena transportu auta, motocykla lub wybranych towarów.'
  },
  '/contact': {
    title: 'Kontakt | Busy Jarosław',
    description: 'Skontaktuj się z Busy Jarosław. Przejazdy Jarosław Wiedeń, wynajem busa, laweta i transport pojazdów. Telefon 663 063 364.'
  },
  ...Object.fromEntries(Object.values(LANDING_PAGES).map((page) => [page.path, { title: page.title, description: page.description }]))
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

function faqStructuredData(pathname) {
  const path = normalizePath(pathname);
  const page = Object.values(LANDING_PAGES).find((item) => item.path === path);
  if (!page?.faq?.length) return null;
  return {
    '@type': 'FAQPage',
    '@id': `${canonicalFor(path)}#faq`,
    mainEntity: page.faq.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer
      }
    }))
  };
}

function structuredData(contactEmail, pathname) {
  const url = `${baseUrl()}/`;
  const email = String(contactEmail || FALLBACK_CONTACT_EMAIL).trim();
  const services = [
    service('Przewóz osób Jarosław Wiedeń', `${baseUrl()}/booking`, 'przewóz osób'),
    service('Wynajem busa Jarosław', `${baseUrl()}/rental`, 'wynajem busa'),
    service('Laweta Jarosław', `${baseUrl()}/tow`, 'laweta'),
    service('Transport pojazdów Jarosław', `${baseUrl()}/tow`, 'transport pojazdów')
  ];
  const faq = faqStructuredData(pathname);
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': `${baseUrl()}/#business`,
        name: SITE_NAME,
        url,
        telephone: CONTACT_PHONE_E164,
        email: email || undefined,
        areaServed: ['Jarosław', 'Podkarpacie', 'Wiedeń', 'Austria'].map(place),
        serviceType: ['przewóz osób', 'wynajem busa', 'laweta', 'transport pojazdów'],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Usługi transportowe',
          itemListElement: services.map((item) => ({
            '@type': 'Offer',
            itemOffered: item
          }))
        }
      },
      ...services,
      ...(faq ? [faq] : [])
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
    setStructuredData(publicPage ? structuredData(contactEmail, pathname) : null);
  }, [pathname, contactEmail]);

  return null;
}

// TODO: Docelowo można rozważyć prerender publicznych tras dla SEO.
