import { legal } from "@/data/legal";
import { defaultLocale } from "@/i18n/config";
import LegalDoc from "@/components/organisms/LegalDoc";

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const doc = legal.terms[locale] || legal.terms[defaultLocale];
  return {
    title: doc.title,
    alternates: { canonical: `/${locale}/cgv` },
  };
}

export default async function TermsPage({ params }) {
  const { locale } = await params;
  const doc = legal.terms[locale] || legal.terms[defaultLocale];
  return <LegalDoc doc={doc} />;
}
