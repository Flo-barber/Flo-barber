"use server";

import { createClient } from "@/lib/supabase/server";
import { getSaveUrl, isConfigured } from "@/lib/googleWallet";

// Renvoie l'URL « Ajouter à Google Wallet » pour le client connecté.
export async function getWalletSaveUrl() {
  if (!isConfigured()) {
    return { error: "Google Wallet n'est pas encore configuré." };
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, points")
    .eq("id", user.id)
    .single();

  try {
    const url = await getSaveUrl({
      clientId: user.id,
      name: profile?.full_name,
      points: profile?.points || 0,
    });
    return { url };
  } catch (e) {
    return { error: e?.message || "Erreur lors de la génération de la carte." };
  }
}
