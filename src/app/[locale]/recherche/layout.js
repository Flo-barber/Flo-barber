import { getT } from "@/i18n/dictionaries";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return {
    title: t("meta.searchTitle"),
    description: t("meta.searchDesc"),
    alternates: { canonical: `/${locale}/recherche` },
    openGraph: {
      title: t("meta.searchOgTitle"),
      description: t("meta.searchOgDesc"),
      // Next ne fusionne pas `openGraph` avec celui du layout parent : on
      // redéclare l'image, sinon la page n'aurait pas d'aperçu.
      images: [{ url: "/og-image-v2.jpg", width: 1200, height: 630, alt: "Flo Barber" }],
    },
  };
}

export default function RechercheLayout({ children }) {
  return children;
}
