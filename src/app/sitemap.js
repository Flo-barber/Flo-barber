import { locales } from "@/i18n/config";

export default function sitemap() {
  const base = "https://flo-barber.vercel.app";
  const now = new Date();
  const pages = [
    { path: "", priority: 1 },
    { path: "/recherche", priority: 0.8 },
    { path: "/catalogue", priority: 0.5 },
    { path: "/cgv", priority: 0.2 },
    { path: "/confidentialite", priority: 0.2 },
    { path: "/mentions-legales", priority: 0.2 },
  ];

  return locales.flatMap((locale) =>
    pages.map((p) => ({
      url: `${base}/${locale}${p.path}`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: p.priority,
      alternates: {
        languages: Object.fromEntries(
          locales.map((l) => [l, `${base}/${l}${p.path}`])
        ),
      },
    }))
  );
}
