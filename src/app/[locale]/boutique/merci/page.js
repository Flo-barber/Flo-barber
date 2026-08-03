import Link from "@/i18n/Link";
import { getT } from "@/i18n/dictionaries";
import ClearCartOnMount from "@/cart/ClearCartOnMount";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  return {
    title: getT(locale)("shop.thanksTitle"),
    robots: { index: false, follow: false },
  };
}

export default async function ThanksPage({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return (
    <section className="section">
      <div className="container shop-thanks">
        <ClearCartOnMount />
        <div className="shop-thanks-icon gold-text">✓</div>
        <h1 className="section-title">{t("shop.thanksTitle")}</h1>
        <p className="section-subtitle">{t("shop.thanksText")}</p>
        <Link href="/boutique" className="btn btn-primary">
          {t("shop.backToShop")}
        </Link>
      </div>
    </section>
  );
}
