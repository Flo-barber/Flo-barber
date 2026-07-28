import "@/styles/globals.scss";
import { Grenze_Gotisch, Oswald } from "next/font/google";
import Navbar from "@/components/organisms/Navbar";
import Footer from "@/components/organisms/Footer";
import ServiceWorker from "@/components/ServiceWorker";
import LanguageSwitcher from "@/components/molecules/LanguageSwitcher";
import { I18nProvider } from "@/i18n/I18nProvider";
import { getDictionary, getT } from "@/i18n/dictionaries";
import { locales } from "@/i18n/config";

// DA « béton / métal » : gothique moderne LISIBLE (Grenze Gotisch) en graisse légère
// pour la marque et les grands titres ; condensée (Oswald) pour sur-titres / boutons.
const gothic = Grenze_Gotisch({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-gothic",
});

const condensed = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-condensed",
});

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const t = getT(locale);
  return {
    metadataBase: new URL("https://flo-barber.vercel.app"),
    title: {
      default: t("meta.homeTitle"),
      template: "%s | Flo Barber",
    },
    description: t("meta.homeDesc"),
    alternates: {
      canonical: `/${locale}`,
      languages: { fr: "/fr", en: "/en" },
    },
    openGraph: {
      title: "Flo Barber",
      description: t("meta.homeDesc"),
      type: "website",
      locale: locale === "en" ? "en_US" : "fr_FR",
      siteName: "Flo Barber",
      images: [{ url: "/og-image.png", width: 1200, height: 630, alt: "Flo Barber" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "Flo Barber",
      description: t("meta.homeDesc"),
      images: ["/og-image.png"],
    },
    robots: { index: true, follow: true },
    manifest: "/manifest.webmanifest",
    applicationName: "Flo Barber",
    appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "Flo Barber" },
    other: { "mobile-web-app-capable": "yes" },
    icons: {
      icon: [
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: "/apple-touch-icon.png",
    },
  };
}

export const viewport = {
  themeColor: "#0d0d0f",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children, params }) {
  const { locale } = await params;
  const dict = getDictionary(locale);

  return (
    <html lang={locale} className={`${gothic.variable} ${condensed.variable}`}>
      <body>
        <I18nProvider locale={locale} dict={dict}>
          <LanguageSwitcher />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <ServiceWorker />
        </I18nProvider>
      </body>
    </html>
  );
}
