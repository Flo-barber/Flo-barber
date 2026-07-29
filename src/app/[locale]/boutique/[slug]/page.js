import Link from "@/i18n/Link";
import catalogue from "@/data/catalogue.json";
import { getT } from "@/i18n/dictionaries";
import { locales } from "@/i18n/config";

// STUB : fiche produit placeholder. La vraie boutique (panier, paiement, stock…)
// reste à construire — ici on prépare seulement le terrain (route + données mock).
export function generateStaticParams() {
  return locales.flatMap((locale) =>
    catalogue.products.map((p) => ({ locale, slug: p.slug }))
  );
}

function getProduct(slug) {
  return catalogue.products.find((p) => p.slug === slug) || null;
}

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const t = getT(locale);
  const product = getProduct(slug);
  return {
    title: product ? product.name[locale] : t("boutique.notFound"),
    robots: { index: false, follow: true },
  };
}

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const t = getT(locale);
  const product = getProduct(slug);

  if (!product) {
    return (
      <section className="section">
        <div className="container boutique-stub">
          <p>{t("boutique.notFound")}</p>
          <Link href="/catalogue" className="btn btn-outline">
            {t("boutique.backCatalogue")}
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="section">
      <div className="container boutique-stub">
        <div className="boutique-stub-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name[locale]} />
        </div>
        <div className="boutique-stub-body">
          <span className="boutique-stub-badge">{t("boutique.soonBadge")}</span>
          <h1 className="boutique-stub-name">{product.name[locale]}</h1>
          <p className="boutique-stub-tag">{product.tagline[locale]}</p>
          <p className="boutique-stub-price gold-text">{product.price}</p>
          <p className="boutique-stub-soon">{t("boutique.soonText")}</p>
          <Link href="/catalogue" className="btn btn-outline">
            {t("boutique.backCatalogue")}
          </Link>
        </div>
      </div>
    </section>
  );
}
