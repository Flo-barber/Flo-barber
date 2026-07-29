import { getT } from "@/i18n/dictionaries";
import CatalogueViewer from "@/components/organisms/CatalogueViewer";

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
        <p className="section-subtitle">{t("cataloguePage.intro")}</p>
      </div>

      <div className="container">
        <CatalogueViewer />
      </div>
    </section>
  );
}
