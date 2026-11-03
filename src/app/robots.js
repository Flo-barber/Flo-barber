import { SITE_URL } from "@/lib/site";

export default function robots() {
  const base = SITE_URL;
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
