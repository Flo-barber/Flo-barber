"use server";

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { updatePoints } from "@/lib/googleWallet";
import { buildLineItems } from "@/lib/products";
import {
  SHIPPING_CENTS,
  POINT_MIN_REDEEM,
  pointsToCents,
  maxRedeemablePoints,
} from "@/lib/format";

// Synchronise le solde de points sur la carte Google Wallet (best-effort).
async function syncWallet(supabase, userId) {
  try {
    const { data: prof } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", userId)
      .single();
    await updatePoints(userId, prof?.points ?? 0);
  } catch {
    // Ne bloque jamais si le Wallet n'est pas configuré / carte non ajoutée.
  }
}

// Crée une session Stripe Checkout (mode paiement, expédition).
// Les prix sont TOUJOURS recalculés côté serveur (jamais ceux du client).
// `pointsToUse` : nombre de Flo Points que le client souhaite utiliser (remise).
export async function createCheckoutSession(items, locale = "fr", pointsToUse = 0) {
  if (!stripe) return { error: "not_configured" };

  const { line, totalCents, stockErrors } = await buildLineItems(items);
  if (stockErrors.length) return { error: "stock" };
  if (!line.length) return { error: "empty" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const h = await headers();
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ||
    `${h.get("x-forwarded-proto") || "https"}://${h.get("host")}`;
  const lang = locale === "en" ? "en" : "fr";

  // Total de la commande (produits + livraison). La livraison est un line item
  // pour que la remise en points puisse couvrir le total (les coupons Stripe ne
  // s'appliquent pas aux "shipping_options").
  const orderTotalCents = totalCents + SHIPPING_CENTS;

  // --- Remise en points (uniquement pour un client connecté) ---
  let effectivePoints = 0;
  let discountCents = 0;
  const requested = Math.max(0, Math.floor(Number(pointsToUse) || 0));
  if (user && requested >= POINT_MIN_REDEEM) {
    // Solde réel du client (source de vérité serveur).
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("id", user.id)
      .maybeSingle();
    const balance = profile?.points ?? 0;
    // Plafonné par : demande, solde, et ce qui laisse au moins 0,50 € à payer.
    effectivePoints = Math.min(requested, balance, maxRedeemablePoints(orderTotalCents));
    if (effectivePoints < POINT_MIN_REDEEM) {
      effectivePoints = 0; // en dessous du seuil après plafonnement → pas de remise
    } else {
      discountCents = pointsToCents(effectivePoints);
    }
  }

  const lineItems = line.map(({ product, qty, cents }) => ({
    quantity: qty,
    price_data: {
      currency: "eur",
      unit_amount: cents,
      product_data: {
        name: product.name[lang] || product.name.fr,
        // L'image peut être une URL absolue (upload Storage) ou un chemin relatif
        // du seed → on ne préfixe l'origine que pour les chemins relatifs.
        images: product.image
          ? [
              product.image.startsWith("http")
                ? product.image
                : `${origin}${product.image}`,
            ]
          : undefined,
      },
    },
  }));
  // Livraison en tant que line item (voir plus haut).
  lineItems.push({
    quantity: 1,
    price_data: {
      currency: "eur",
      unit_amount: SHIPPING_CENTS,
      product_data: {
        name: lang === "en" ? "Standard shipping" : "Livraison standard",
      },
    },
  });

  let coupon = null;
  try {
    if (discountCents > 0) {
      coupon = await stripe.coupons.create({
        amount_off: discountCents,
        currency: "eur",
        duration: "once",
        name: "Flo Points",
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: lang,
      line_items: lineItems,
      discounts: coupon ? [{ coupon: coupon.id }] : undefined,
      customer_email: user?.email || undefined,
      client_reference_id: user?.id || undefined,
      // Expiration au minimum autorisé par Stripe (30 min) : libère au plus vite
      // les points réservés si le client abandonne sans revenir sur le panier
      // (webhook checkout.session.expired). Retour explicite = libération immédiate.
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
      metadata: {
        userId: user?.id || "",
        items: JSON.stringify(items).slice(0, 480),
        pointsUsed: String(effectivePoints),
        discountCents: String(discountCents),
      },
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "LU", "MC", "CH"],
      },
      success_url: `${origin}/${locale}/boutique/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/boutique/panier?session_id={CHECKOUT_SESSION_ID}`,
    });

    // Réserve les points MAINTENANT (atomique). Si le solde est insuffisant
    // (course avec un autre paiement), on annule la session : elle ne sera
    // jamais payable avec une remise non couverte par des points.
    if (effectivePoints > 0) {
      const { data: held, error: holdErr } = await supabase.rpc("hold_points", {
        p_points: effectivePoints,
        p_cents: discountCents,
        p_session: session.id,
      });
      if (holdErr || held !== true) {
        try {
          await stripe.checkout.sessions.expire(session.id);
        } catch {}
        if (coupon) {
          try {
            await stripe.coupons.del(coupon.id);
          } catch {}
        }
        return { error: "points" };
      }
      // Hold réussi → la carte Wallet reflète tout de suite les points réservés.
      await syncWallet(supabase, user.id);
    }

    return { url: session.url };
  } catch (e) {
    if (coupon) {
      try {
        await stripe.coupons.del(coupon.id);
      } catch {}
    }
    return { error: e?.message || "error" };
  }
}

// Annulation d'un paiement (le client revient sur le panier sans payer).
// Sécurisé : on vérifie que la session appartient bien au client connecté et
// qu'elle n'est pas déjà payée, puis on l'expire (elle devient non payable) et
// on rend immédiatement les points réservés. Idempotent.
export async function cancelCheckout(sessionId) {
  if (!stripe || !sessionId) return { error: "bad_request" };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "auth" };

  let session;
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId);
  } catch {
    return { error: "not_found" };
  }

  // La session doit appartenir à ce client (empêche de toucher celle d'un autre).
  if (session.metadata?.userId !== user.id) return { error: "forbidden" };
  // Déjà payée / fermée → rien à libérer.
  if (session.status !== "open" || session.payment_status === "paid") {
    return { ok: true };
  }

  // Rend la session non payable (déclenche aussi checkout.session.expired).
  try {
    await stripe.checkout.sessions.expire(sessionId);
  } catch {}

  // Rembourse les points réservés tout de suite (idempotent : n'agit que sur un
  // hold encore 'held' ; le webhook expired ferait la même chose sinon).
  const admin = createAdminClient();
  if (admin) {
    await admin.rpc("release_redemption", { p_session: sessionId });
  }

  // La carte Wallet reflète tout de suite les points rendus.
  await syncWallet(supabase, user.id);

  return { ok: true };
}
