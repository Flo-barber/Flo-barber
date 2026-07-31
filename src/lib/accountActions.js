"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// RGPD — droit à l'effacement : supprime le compte de l'utilisateur connecté et
// TOUTES ses données (profil, transactions supprimés en cascade via le schéma).
// Nécessite la clé de service (SUPABASE_SERVICE_ROLE_KEY), utilisée uniquement
// côté serveur. L'utilisateur ne peut supprimer que son PROPRE compte.
export async function deleteAccount() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const admin = createAdminClient();
  if (!admin) {
    return {
      error:
        "Suppression indisponible : la clé de service Supabase n'est pas configurée.",
    };
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: error.message };

  // Déconnecte la session côté serveur (le cookie sera invalidé).
  await supabase.auth.signOut();
  return { ok: true };
}
