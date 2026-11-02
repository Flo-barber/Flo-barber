import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";

// Pages optionnelles activables depuis l'admin (table `page_settings`).
// Usage SERVEUR. Client anonyme SANS cookies (lecture publique) pour pouvoir
// être mis en cache : invalidé par le tag `page-settings` au changement.
export const TOGGLABLE_PAGES = ["catalogue", "boutique"];
export const PAGE_SETTINGS_TAG = "page-settings";

const DEFAULTS = Object.fromEntries(TOGGLABLE_PAGES.map((p) => [p, true]));

export const getPageFlags = unstable_cache(
  async () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return DEFAULTS;
    const supabase = createClient(url, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data, error } = await supabase
      .from("page_settings")
      .select("slug, enabled");
    // En cas d'erreur (table absente…), les pages restent visibles.
    if (error || !data) return DEFAULTS;
    const flags = { ...DEFAULTS };
    for (const r of data) {
      if (r.slug in flags) flags[r.slug] = r.enabled !== false;
    }
    return flags;
  },
  ["page-flags"],
  { tags: [PAGE_SETTINGS_TAG] }
);
