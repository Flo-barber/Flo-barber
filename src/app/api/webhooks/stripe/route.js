import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

  if (event.type === "checkout.session.completed") {
    const s = event.data.object;
    const admin = createAdminClient();
    if (!admin) {
      console.error(
        "[stripe webhook] SUPABASE_SERVICE_ROLE_KEY manquante → commande et points NON enregistrés."
      );
      return NextResponse.json({ received: true });
    }

    const amount = (s.amount_total || 0) / 100;
    const userId = s.metadata?.userId || null;
    let items = [];
    try {
      items = JSON.parse(s.metadata?.items || "[]");
    } catch {
      // ignore
    }

    const { error: orderErr } = await admin.from("orders").insert({
      user_id: userId || null,
      email: s.customer_details?.email || s.customer_email || null,
      amount_eur: amount,
      currency: s.currency || "eur",
      items,
      fulfillment: "shipping",
      shipping: s.shipping_details || s.customer_details?.address || null,
      stripe_session_id: s.id,
      status: "paid",
    });
    if (orderErr)
      console.error("[stripe webhook] insertion commande KO :", orderErr.message);

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

    // Points de fidélité pour les clients connectés (bypass RLS via service role).
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
  }

  return NextResponse.json({ received: true });
}
