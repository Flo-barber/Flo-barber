import { locales } from "@/i18n/config";
import { getPageFlags } from "@/lib/pageSettings";
import { SITE_URL } from "@/lib/site";

export default async function sitemap() {
  const flags = await getPageFlags();
  const base = SITE_URL;
  const now = new Date();
  const pages = [
    { path: "", priority: 1 },
    { path: "/recherche", priority: 0.8 },
    flags.catalogue && { path: "/catalogue", priority: 0.5 },
    flags.boutique && { path: "/boutique", priority: 0.7 },
    { path: "/cgv", priority: 0.2 },
    { path: "/confidentialite", priority: 0.2 },
    { path: "/mentions-legales", priority: 0.2 },
  ].filter(Boolean);

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
