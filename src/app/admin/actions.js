"use server";

import { createClient } from "@/lib/supabase/server";
import { updatePoints } from "@/lib/googleWallet";

// Crédite des points à un client. RÉSERVÉ aux administrateurs (salon).
// 1 € = 1 point (points = partie entière du montant).
export async function creditPoints(clientId, amountEur) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  // Vérifie que l'utilisateur est bien un administrateur
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "Action réservée au salon." };

  const amount = Number(String(amountEur).replace(",", "."));
  if (!Number.isFinite(amount) || amount <= 0) {
    return { error: "Montant invalide." };
  }

  const points = Math.floor(amount); // 1 € = 1 point

  const { error } = await supabase.from("transactions").insert({
    client_id: clientId,
    amount_eur: amount,
    points,
    created_by: user.id,
  });
  if (error) return { error: error.message };

  // Synchronise le nouveau solde sur la carte Google Wallet du client (best-effort).
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", clientId)
      .single();
    await updatePoints(clientId, prof?.points ?? 0);
  } catch {
    // Ne bloque jamais le crédit si le wallet n'est pas configuré / carte non ajoutée.
  }

  return { ok: true, points };
}
