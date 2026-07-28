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
    },
  };
}

export default function RechercheLayout({ children }) {
  return children;
}
