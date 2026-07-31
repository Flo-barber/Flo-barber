import { legal } from "@/data/legal";
import { defaultLocale } from "@/i18n/config";
import LegalDoc from "@/components/organisms/LegalDoc";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const doc = legal.privacy[locale] || legal.privacy[defaultLocale];
  return {
    title: doc.title,
    alternates: { canonical: `/${locale}/confidentialite` },
  };
}

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  const doc = legal.privacy[locale] || legal.privacy[defaultLocale];
  return <LegalDoc doc={doc} />;
}
