import Link from "next/link";
import salons from "@/data/salons";

export const metadata = {
  title: "Flo Barber — L'art du rasage & de la coupe",
  description:
    "Bienvenue chez Flo Barber, barbier, coiffeur homme & visagiste. Trouvez le salon le plus proche et réservez votre rendez-vous en ligne.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section className="hero">
        <div className="hero-overlay" />
        <div className="container hero-content">
          <p className="hero-eyebrow">Barbier · Coiffeur homme · Visagiste</p>
          <h1 className="hero-title">
            L'art du rasage
            <br />
            <span className="gold-text">& de la coupe</span>
          </h1>
          <p className="hero-sub">
            Spécialiste en coupes & taille de barbe sur-mesure.
          </p>
          <div className="hero-actions">
            <Link href="/recherche" className="btn btn-primary">
              Trouver un salon
            </Link>
            <Link href="/catalogue" className="btn btn-outline">
              Voir le catalogue
            </Link>
          </div>
        </div>
      </section>

      {/* SERVICES */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">
            Nos <span className="gold-text">prestations</span>
          </h2>
          <p className="section-subtitle">
            Un savoir-faire traditionnel au service de votre style.
          </p>
          <div className="cards">
            {[
              {
                t: "Coupe signature",
                d: "Une coupe sur-mesure réalisée par nos barbiers experts, adaptée à votre visage et votre style.",
              },
              {
                t: "Taille de barbe",
                d: "Dessin, taille et entretien de la barbe au rasoir, avec soin des huiles et baumes premium.",
              },
              {
                t: "Rasage traditionnel",
                d: "Le rituel complet au coupe-chou et serviette chaude, pour un rasage de près incomparable.",
              },
            ].map((s) => (
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
              {salons.length} salon{salons.length > 1 ? "s" : ""}{" "}
              <span className="gold-text">près de chez vous</span>
            </h2>
            <p className="locations-desc">
              Retrouvez l'ensemble de nos salons sur une carte interactive.
              Recherchez par ville ou code postal et réservez directement en
              ligne via Planity.
            </p>
            <Link href="/recherche" className="btn btn-primary">
              Ouvrir la carte
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
