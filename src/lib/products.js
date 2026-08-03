import { createClient } from "@/lib/supabase/server";

// Accès aux produits en base (Supabase). Usage SERVEUR (Server Components,
// server actions). Les prix sont en centimes ; le stock `null` = illimité.
function mapRow(r) {
  return {
    slug: r.slug,
    name: { fr: r.name_fr, en: r.name_en },
    tagline: { fr: r.tagline_fr, en: r.tagline_en },
    priceCents: r.price_cents,
    image: r.image,
    stock: r.stock,
    active: r.active,
    sort: r.sort,
  };
}

export async function getProducts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error || !data) return [];
  return data.map(mapRow);
}

export async function getProduct(slug) {
  const supabase = createClient();
  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ? mapRow(data) : null;
}

export async function getProductsBySlugs(slugs) {
  if (!slugs || !slugs.length) return {};
  const supabase = createClient();
  const { data } = await supabase.from("products").select("*").in("slug", slugs);
  const map = {};
  (data || []).forEach((r) => {
    map[r.slug] = mapRow(r);
  });
  return map;
}

// Reconstruit les lignes du panier depuis la base (jamais les prix du client),
// en vérifiant la disponibilité (stock).
export async function buildLineItems(items) {
  const bySlug = await getProductsBySlugs((items || []).map((i) => i.slug));
  const line = [];
  let totalCents = 0;
  const stockErrors = [];
  for (const it of items || []) {
    const p = bySlug[it.slug];
    if (!p || p.active === false) continue;
    const qty = Math.max(1, Math.min(20, parseInt(it.qty, 10) || 1));
    if (p.stock != null && p.stock < qty) {
      stockErrors.push(p.slug);
      continue;
    }
    totalCents += p.priceCents * qty;
    line.push({ product: p, qty, cents: p.priceCents });
  }
  return { line, totalCents, stockErrors };
}
