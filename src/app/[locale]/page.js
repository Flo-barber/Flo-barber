import Link from "@/i18n/Link";
import salons from "@/data/salons";
import { getT } from "@/i18n/dictionaries";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return {
    title: t("meta.homeTitle"),
    description: t("meta.homeDesc"),
    alternates: { canonical: `/${locale}` },
  };
}

export default async function HomePage({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  const services = t("home.services");
  const salonWord = salons.length > 1 ? t("common.salons") : t("common.salon");

  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="hero-eyebrow">{t("home.eyebrow")}</p>
          <h1 className="hero-title">
            {t("home.titleLine1")}
            <br />
            <span className="gold-text">{t("home.titleLine2")}</span>
          </h1>
          <p className="hero-sub">{t("home.sub")}</p>
          <div className="hero-actions">
            <Link href="/recherche" className="btn btn-primary">
              {t("home.ctaFind")}
            </Link>
            <Link href="/catalogue" className="btn btn-outline">
              {t("home.ctaCatalogue")}
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">
            {t("home.servicesTitlePre")}
            <span className="gold-text">{t("home.servicesTitleAccent")}</span>
          </h2>
          <p className="section-subtitle">{t("home.servicesSub")}</p>
          <div className="cards">
            {services.map((s) => (
              <article key={s.t} className="card">
                <div className="card-icon gold-text">✦</div>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* LOCATIONS TEASER */}
      <section className="section section-alt">
        <div className="container locations">
          <div className="locations-text">
            <h2 className="section-title locations-title">
              {salons.length} {salonWord}{" "}
              <span className="gold-text">{t("home.locationsAccent")}</span>
            </h2>
            <p className="locations-desc">{t("home.locationsDesc")}</p>
            <Link href="/recherche" className="btn btn-primary">
              {t("home.ctaMap")}
            </Link>
          </div>
          <ul className="locations-list">
            {salons.map((s) => (
              <li key={s.id}>
                <span className="dot gold-text">●</span>
                <div>
                  <strong>{s.city}</strong>
                  <br />
                  <span className="locations-addr">
                    {s.address}, {s.postalCode}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
