import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePoints } from "@/lib/googleWallet";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Synchronise le solde de points sur la carte Google Wallet du client (best-effort).
async function syncWallet(admin, userId) {
  try {
    const { data: prof } = await admin
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();
    await updatePoints(userId, prof?.points ?? 0);
  } catch {
    // Ne bloque jamais si le Wallet n'est pas configuré / carte non ajoutée.
  }
}

// Webhook Stripe : à la commande payée, on enregistre la commande et on crédite
// les points de fidélité (1 € = 1 point) si le client a un compte.
export async function POST(req) {
  if (!stripe || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "stripe_not_configured" }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text(); // corps brut requis pour la vérification de signature

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (e) {
    console.error("[stripe webhook] signature invalide :", e.message);
    return NextResponse.json(
      { error: `Webhook error: ${e.message}` },
      { status: 400 }
    );
  }

  const admin = createAdminClient();

  // Paiement abandonné/expiré : on libère les points réservés (hold).
  if (event.type === "checkout.session.expired") {
    if (admin) {
      const sid = event.data.object.id;
      const { error } = await admin.rpc("release_redemption", { p_session: sid });
      if (error)
        console.error("[stripe webhook] libération points KO :", error.message);
      // Resynchronise la carte Wallet du client concerné.
      const { data: red } = await admin
        .from("redemptions")
        .select("user_id")
        .eq("stripe_session_id", sid)
        .maybeSingle();
      if (red?.user_id) await syncWallet(admin, red.user_id);
    }
    return NextResponse.json({ received: true });
  }

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    if (!admin) {
      console.error(
        "[stripe webhook] SUPABASE_SERVICE_ROLE_KEY manquante → commande et points NON enregistrés."
      );
      return NextResponse.json({ received: true });
    }

    const amount = (s.amount_total || 0) / 100; // montant réellement payé (après remise)
    const userId = s.metadata?.userId || null;
    const pointsUsed = parseInt(s.metadata?.pointsUsed || "0", 10) || 0;
    const discountCents = parseInt(s.metadata?.discountCents || "0", 10) || 0;
    let items = [];
    try {
      items = JSON.parse(s.metadata?.items || "[]");
    } catch {
      // ignore
    }

    // Instantané des produits achetés : on fige nom (FR/EN) et prix unitaire au
    // moment du paiement, pour que l'historique reste exact même si le produit
    // est renommé / re-tarifé / supprimé plus tard.
    const slugs = [...new Set(items.map((it) => it?.slug).filter(Boolean))];
    let orderItems = items;
    if (slugs.length) {
      const { data: prods } = await admin
        .from("products")
        .select("slug, name_fr, name_en, price_cents")
        .in("slug", slugs);
      const bySlug = Object.fromEntries((prods || []).map((p) => [p.slug, p]));
      orderItems = items.map((it) => {
        const p = bySlug[it.slug];
        return {
          slug: it.slug,
          qty: Math.max(1, parseInt(it.qty, 10) || 1),
          name_fr: p?.name_fr ?? null,
          name_en: p?.name_en ?? null,
          price_cents: p?.price_cents ?? null,
        };
      });
    }

    const { error: orderErr } = await admin.from("orders").insert({
      user_id: userId || null,
      email: s.customer_details?.email || s.customer_email || null,
      amount_eur: amount,
      currency: s.currency || "eur",
      items: orderItems,
      fulfillment: "shipping",
      shipping: s.shipping_details || s.customer_details?.address || null,
      stripe_session_id: s.id,
      status: "paid",
      points_used: pointsUsed,
      discount_cents: discountCents,
    });
    if (orderErr)
      console.error("[stripe webhook] insertion commande KO :", orderErr.message);

    // Confirme la réservation de points (les points ont déjà été déduits au hold).
    if (pointsUsed > 0) {
      const { error: cfmErr } = await admin.rpc("confirm_redemption", {
        p_session: s.id,
      });
      if (cfmErr)
        console.error("[stripe webhook] confirmation points KO :", cfmErr.message);
    }

    // Décrémente le stock des produits achetés (atomique, ignore ceux à stock null).
    for (const it of items) {
      if (!it?.slug) continue;
      const qty = Math.max(1, parseInt(it.qty, 10) || 1);
      const { error: stkErr } = await admin.rpc("decrement_stock", {
        p_slug: it.slug,
        p_qty: qty,
      });
      if (stkErr)
        console.error(
          `[stripe webhook] décrément stock ${it.slug} KO :`,
          stkErr.message
        );
    }

    // Gain de points pour les clients connectés : 1 € payé = 1 point (bypass RLS
    // via la clé de service). Basé sur le montant réellement payé (après remise).
    if (userId) {
      const points = Math.floor(amount);
      if (points > 0) {
        const { error: txErr } = await admin.from("transactions").insert({
          client_id: userId,
          amount_eur: amount,
          points,
          created_by: null,
        });
        if (txErr)
          console.error("[stripe webhook] crédit points KO :", txErr.message);
      }
    }

    // Resynchronise la carte Google Wallet avec le solde final (déduction éventuelle
    // + gain). Best-effort : n'affecte pas l'enregistrement de la commande.
    if (userId) await syncWallet(admin, userId);
  }

  return NextResponse.json({ received: true });
}
