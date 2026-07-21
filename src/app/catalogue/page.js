import Link from "next/link";

export const metadata = {
  title: "Catalogue",
  description:
    "Découvrez bientôt le catalogue de produits et prestations Flo Barber.",
  alternates: { canonical: "/catalogue" },
};

export default function CataloguePage() {
  return (
    <section className="section">
      <div className="container catalogue">
        <p className="catalogue-eyebrow gold-text">Boutique</p>
        <h1 className="section-title">
          Notre <span className="gold-text">catalogue</span>
        </h1>
        <p className="section-subtitle">
          Nos produits et prestations arrivent très bientôt. Restez connecté !
        </p>

        <div className="catalogue-empty">
          <div className="catalogue-icon gold-text">✦</div>
          <h2>Bientôt disponible</h2>
          <p>
            Cette page accueillera prochainement notre sélection de produits de
            soin, accessoires et cartes cadeaux. En attendant, retrouvez nos
            salons et réservez votre rendez-vous.
          </p>
          <Link href="/recherche" className="btn btn-primary">
            Trouver un salon
          </Link>
        </div>
      </div>
    </section>
  );
}
