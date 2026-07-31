import { legal } from "@/data/legal";
import { defaultLocale } from "@/i18n/config";
import LegalDoc from "@/components/organisms/LegalDoc";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const doc = legal.mentions[locale] || legal.mentions[defaultLocale];
  return {
    title: doc.title,
    alternates: { canonical: `/${locale}/mentions-legales` },
  };
}

export default async function LegalNoticePage({ params }) {
  const { locale } = await params;
  const doc = legal.mentions[locale] || legal.mentions[defaultLocale];
  return <LegalDoc doc={doc} />;
}
