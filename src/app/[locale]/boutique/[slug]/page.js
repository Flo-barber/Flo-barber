import { getProduct } from "@/lib/products";
import { formatEuro } from "@/lib/format";
import { getT } from "@/i18n/dictionaries";
import AddToCart from "@/components/molecules/AddToCart";
import BackButton from "@/components/atoms/BackButton";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const { locale, slug } = await params;
  const t = getT(locale);
  const product = await getProduct(slug);
  return {
    title: product ? product.name[locale] : t("shop.notFound"),
    alternates: { canonical: `/${locale}/boutique/${slug}` },
  };
}

export default async function ProductPage({ params }) {
  const { locale, slug } = await params;
  const t = getT(locale);
  const product = await getProduct(slug);

  if (!product || product.active === false) {
    return (
      <section className="section">
        <div className="container product">
          <p>{t("shop.notFound")}</p>
          <BackButton className="btn btn-outline" fallback="/boutique">
            {t("common.back")}
          </BackButton>
        </div>
      </section>
    );
  }

  const out = product.stock != null && product.stock <= 0;

  return (
    <section className="section">
      <div className="container product">
        <div className="product-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={product.image} alt={product.name[locale]} />
        </div>
        <div className="product-body">
          <p className="product-eyebrow gold-text">{t("shop.eyebrow")}</p>
          <h1 className="product-name">{product.name[locale]}</h1>
          <p className="product-tag">{product.tagline[locale]}</p>
          <p className="product-price gold-text">
            {formatEuro(product.priceCents, locale)}
          </p>
          <p className="product-shipping">{t("shop.shippingNote")}</p>
          {out ? (
            <p className="shop-out">{t("shop.outOfStock")}</p>
          ) : (
            <AddToCart slug={product.slug} />
          )}
          <BackButton className="product-back" fallback="/boutique" arrowSize={16}>
            {t("common.back")}
          </BackButton>
        </div>
      </div>
    </section>
  );
}
