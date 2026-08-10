import { createClient } from "@/lib/supabase/server";

// Accès aux coupes du catalogue en base (Supabase). Usage SERVEUR.
// On mappe vers la forme attendue par le CatalogueViewer :
//   { slug, title:{fr,en}, description:{fr,en}, images:[{src, alt:{fr,en}}], products:[slug] }
function mapRow(r) {
  const title = { fr: r.title_fr, en: r.title_en };
  const imgs = Array.isArray(r.images) ? r.images : [];
  return {
    slug: r.slug,
    title,
    description: { fr: r.description_fr || "", en: r.description_en || "" },
    // alt = titre de la coupe (bilingue) pour rester accessible sans saisie manuelle.
    images: imgs.map((src) => ({ src, alt: title })),
    products: Array.isArray(r.products) ? r.products : [],
    active: r.active,
    sort: r.sort,
  };
}

export async function getCuts() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("cuts")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error || !data) return [];
  return data.map(mapRow);
}
