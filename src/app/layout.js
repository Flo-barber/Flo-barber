import "@/styles/globals.scss";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ServiceWorker from "@/components/ServiceWorker";

export const metadata = {
  metadataBase: new URL("https://flo-barber.vercel.app"),
  title: {
    default: "Flo Barber — Trouvez votre salon de coiffure",
    template: "%s | Flo Barber",
  },
  description:
    "Trouvez le salon de coiffure Flo Barber le plus proche de chez vous et réservez en ligne. Coupe, barbe et rasage traditionnel.",
  keywords: ["barbier", "coiffure", "salon", "Flo Barber", "réservation", "coupe homme"],
  alternates: { canonical: "/" },
  openGraph: {
    title: "Flo Barber — Trouvez votre salon",
    description:
      "Localisez le salon Flo Barber le plus proche et réservez votre rendez-vous en ligne.",
    type: "website",
    locale: "fr_FR",
    siteName: "Flo Barber",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Flo Barber — Barbier, coiffeur homme & visagiste",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Flo Barber — Trouvez votre salon",
    description:
      "Localisez le salon Flo Barber le plus proche et réservez votre rendez-vous en ligne.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.webmanifest",
  applicationName: "Flo Barber",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Flo Barber",
  },
  other: {
    // Version standard (Chrome/Android) en complément de la balise Apple
    "mobile-web-app-capable": "yes",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
        <ServiceWorker />
      </body>
    </html>
  );
}
