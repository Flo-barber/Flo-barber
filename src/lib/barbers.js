import { createClient } from "@/lib/supabase/server";

// Accès aux barbiers (équipe) en base. Usage SERVEUR. Mappé vers la forme
// attendue par la timeline : { slug, name, role:{fr,en}, bio:{fr,en}, image }.
function mapRow(r) {
  return {
    slug: r.slug,
    name: r.name,
    role: { fr: r.role_fr || "", en: r.role_en || "" },
    bio: { fr: r.bio_fr || "", en: r.bio_en || "" },
    image: r.image || null,
  };
}

export async function getBarbers() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("barbers")
    .select("*")
    .eq("active", true)
    .order("sort", { ascending: true });
  if (error || !data) return [];
  return data.map(mapRow);
}
