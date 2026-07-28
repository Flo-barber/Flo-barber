import Link from "@/i18n/Link";
import { getT } from "@/i18n/dictionaries";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return {
    title: t("meta.catalogueTitle"),
    description: t("meta.catalogueDesc"),
    alternates: { canonical: `/${locale}/catalogue` },
  };
}

export default async function CataloguePage({ params }) {
  const { locale } = await params;
  const t = getT(locale);

  return (
    <section className="section">
      <div className="container catalogue">
        <p className="catalogue-eyebrow gold-text">{t("catalogue.eyebrow")}</p>
        <h1 className="section-title">
          {t("catalogue.titlePre")}
          <span className="gold-text">{t("catalogue.titleAccent")}</span>
        </h1>
        <p className="section-subtitle">{t("catalogue.sub")}</p>

        <div className="catalogue-empty">
          <div className="catalogue-icon gold-text">✦</div>
          <h2>{t("catalogue.emptyTitle")}</h2>
          <p>{t("catalogue.emptyText")}</p>
          <Link href="/recherche" className="btn btn-primary">
            {t("catalogue.cta")}
          </Link>
        </div>
      </div>
    </section>
  );
}
