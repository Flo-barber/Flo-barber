import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/i18n/dictionaries";
import ClearCartOnMount from "@/cart/ClearCartOnMount";
import ArrowLeft from "@/components/atoms/ArrowLeft";

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

  // Le lien « mes commandes » n'a de sens que pour un client connecté.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <section className="section">
      <div className="container shop-thanks">
        <ClearCartOnMount />
        <div className="shop-thanks-icon gold-text">✓</div>
        <h1 className="section-title">{t("shop.thanksTitle")}</h1>
        <p className="section-subtitle">{t("shop.thanksText")}</p>
        <div className="shop-thanks-actions">
          {user && (
            <Link href="/compte#commandes" className="btn btn-primary">
              {t("shop.viewOrders")}
            </Link>
          )}
          <Link
            href="/boutique"
            className={user ? "btn btn-outline" : "btn btn-primary"}
          >
            <ArrowLeft />
            {t("shop.backToShop")}
          </Link>
        </div>
      </div>
    </section>
  );
}
