"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { TOGGLABLE_PAGES, PAGE_SETTINGS_TAG } from "@/lib/pageSettings";
import { updatePoints, updateVip } from "@/lib/googleWallet";
import { POINT_MIN_REDEEM, pointsToCents } from "@/lib/format";

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

// Utilise (déduit) des points d'un client, en salon. RÉSERVÉ aux administrateurs.
// Minimum 100 points ; le solde ne peut pas passer sous zéro (garde aussi en base).
export async function redeemPointsAdmin(clientId, pointsToUse) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "Action réservée au salon." };

  const points = Math.floor(Number(String(pointsToUse).replace(",", ".")) || 0);
  if (!Number.isFinite(points) || points < POINT_MIN_REDEEM) {
    return { error: `Minimum ${POINT_MIN_REDEEM} points.` };
  }

  // Vérifie le solde du client (source de vérité serveur).
  const { data: prof } = await supabase
    .from("profiles")
    .select("points")
    .eq("id", clientId)
    .maybeSingle();
  if (!prof) return { error: "Client introuvable." };
  if ((prof.points ?? 0) < points) return { error: "Solde de points insuffisant." };

  // Débit via une transaction négative (le trigger met à jour le solde ; un
  // garde-fou en base empêche tout solde négatif).
  const { error } = await supabase.from("transactions").insert({
    client_id: clientId,
    amount_eur: 0,
    points: -points,
    created_by: user.id,
    kind: "redeem",
  });
  if (error) return { error: error.message };

  // Synchronise le nouveau solde sur la carte Google Wallet (best-effort).
  try {
    const { data: after } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", clientId)
      .single();
    await updatePoints(clientId, after?.points ?? 0);
  } catch {
    // Ne bloque jamais l'opération si le wallet n'est pas configuré.
  }

  return { ok: true, points, cents: pointsToCents(points) };
}

// Active / désactive une page optionnelle du site (catalogue, boutique).
// RÉSERVÉ aux administrateurs (vérif ici + policy RLS `page_settings_write`).
export async function setPageEnabled(slug, enabled) {
  if (!TOGGLABLE_PAGES.includes(slug)) return { error: "Page inconnue." };

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "Action réservée au salon." };

  const { error } = await supabase
    .from("page_settings")
    .upsert({ slug, enabled: !!enabled, updated_at: new Date().toISOString() });
  if (error) return { error: error.message };

  // Purge le cache des réglages + toutes les pages (nav, CTA, sitemap…).
  revalidateTag(PAGE_SETTINGS_TAG);
  revalidatePath("/", "layout");

  return { ok: true, enabled: !!enabled };
}

// Passe un client en VIP (ou retire le statut). RÉSERVÉ aux administrateurs :
// vérif ici + fonction SECURITY DEFINER `set_vip` qui revérifie is_admin().
export async function setVip(clientId, vip) {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!admin) return { error: "Action réservée au salon." };

  const { data, error } = await supabase.rpc("set_vip", {
    p_client: clientId,
    p_vip: !!vip,
  });
  if (error) return { error: error.message };

  // Synchronise le statut sur la carte Google Wallet du client (best-effort).
  try {
    await updateVip(clientId, !!data);
  } catch (e) {
    // Ne bloque jamais le changement de statut ; trace dans les logs (Vercel).
    console.error("[wallet] updateVip:", e?.response?.data?.error || e?.message);
  }

  revalidatePath("/", "layout");
  return { ok: true, vip: !!data };
}
