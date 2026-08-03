import Link from "@/i18n/Link";
import { getProducts } from "@/lib/products";
import { formatEuro } from "@/lib/format";
import { getT } from "@/i18n/dictionaries";
import AddToCart from "@/components/molecules/AddToCart";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return {
    title: t("shop.title"),
    description: t("shop.metaDesc"),
    alternates: { canonical: `/${locale}/boutique` },
  };
}

export default async function ShopPage({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  const products = await getProducts();

  return (
    <section className="section">
      <div className="container">
        <p className="shop-eyebrow gold-text">{t("shop.eyebrow")}</p>
        <h1 className="section-title">{t("shop.title")}</h1>
        <p className="section-subtitle">{t("shop.intro")}</p>

        <div className="shop-grid">
          {products.map((p) => {
            const out = p.stock != null && p.stock <= 0;
            return (
              <article key={p.slug} className="shop-card">
                <Link href={`/boutique/${p.slug}`} className="shop-card-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={p.image} alt={p.name[locale]} />
                </Link>
                <div className="shop-card-body">
                  <Link href={`/boutique/${p.slug}`} className="shop-card-name">
                    {p.name[locale]}
                  </Link>
                  <p className="shop-card-tag">{p.tagline[locale]}</p>
                  <p className="shop-card-price gold-text">
                    {formatEuro(p.priceCents, locale)}
                  </p>
                  {out ? (
                    <span className="shop-out">{t("shop.outOfStock")}</span>
                  ) : (
                    <AddToCart slug={p.slug} />
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
