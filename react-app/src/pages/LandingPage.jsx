import { Link, Navigate } from 'react-router-dom';
import { LANDING_PAGES } from '../data/landingPages.js';

export function LandingPage({ page, contactEmail, contactPhone, contactPhoneHref }) {
  const data = LANDING_PAGES[page];
  if (!data) return <Navigate to="/" replace />;

  return (
    <div className="page active">
      <section className={`landing-hero landing-${page}`}>
        <div className="landing-hero-inner">
          <span className="hero-kicker">{data.eyebrow}</span>
          <h1>{data.h1}</h1>
          <p>{data.heroText}</p>
          <div className="hero-actions">
            <Link className="hero-btn primary" to={data.primaryCta[1]}>{data.primaryCta[0]}</Link>
            <Link className="hero-btn secondary" to={data.secondaryCta[1]}>{data.secondaryCta[0]}</Link>
          </div>
          <div className="hero-contact">
            <span>Kontakt: </span>
            <a href={contactPhoneHref}>{contactPhone}</a>
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
          </div>
        </div>
      </section>

      <section className="section landing-section">
        <div className="seo-panel mb">
          <h2>{data.introTitle}</h2>
          {data.intro.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
          <div className="landing-link-row">
            {data.links.map(([label, to]) => <Link className="btn-outline" key={to} to={to}>{label}</Link>)}
          </div>
        </div>

        <div className="landing-grid">
          <article className="landing-card">
            <h2>Dla kogo</h2>
            <ul className="mini-list">{data.audience.map((item) => <li key={item}>{item}</li>)}</ul>
          </article>
          <article className="landing-card">
            <h2>Jak działa</h2>
            <ol className="landing-steps">{data.steps.map((item) => <li key={item}>{item}</li>)}</ol>
          </article>
          <article className="landing-card">
            <h2>Obszar działania</h2>
            <p>{data.area}</p>
          </article>
        </div>
      </section>

      <section className="section landing-faq-section">
        <div className="landing-faq">
          <h2>FAQ</h2>
          {data.faq.map(([question, answer]) => (
            <details key={question}>
              <summary>{question}</summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
        <div className="landing-cta">
          <h2>Kontakt i wycena</h2>
          <p>Zadzwoń pod numer <a href={contactPhoneHref}>{contactPhone}</a> albo napisz na <a href={`mailto:${contactEmail}`}>{contactEmail}</a>. Możesz też przejść od razu do właściwego formularza.</p>
          <div className="landing-link-row">
            <Link className="btn-primary" to={data.primaryCta[1]}>{data.primaryCta[0]}</Link>
            <Link className="btn-outline" to="/contact">Dane kontaktowe</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
