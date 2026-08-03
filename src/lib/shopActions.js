"use server";

import { headers } from "next/headers";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { buildLineItems } from "@/lib/products";
import { SHIPPING_CENTS } from "@/lib/format";

// Crée une session Stripe Checkout (mode paiement, expédition).
// Les prix sont TOUJOURS recalculés côté serveur (jamais ceux du client).
export async function createCheckoutSession(items, locale = "fr") {
  if (!stripe) return { error: "not_configured" };

  const { line, stockErrors } = await buildLineItems(items);
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      locale: lang,
      line_items: line.map(({ product, qty, cents }) => ({
        quantity: qty,
        price_data: {
          currency: "eur",
          unit_amount: cents,
          product_data: {
            name: product.name[lang] || product.name.fr,
            images: product.image ? [`${origin}${product.image}`] : undefined,
          },
        },
      })),
      customer_email: user?.email || undefined,
      client_reference_id: user?.id || undefined,
      metadata: {
        userId: user?.id || "",
        items: JSON.stringify(items).slice(0, 480),
      },
      phone_number_collection: { enabled: true },
      shipping_address_collection: {
        allowed_countries: ["FR", "BE", "LU", "MC", "CH"],
      },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            fixed_amount: { amount: SHIPPING_CENTS, currency: "eur" },
            display_name:
              lang === "en" ? "Standard shipping" : "Livraison standard",
            delivery_estimate: {
              minimum: { unit: "business_day", value: 2 },
              maximum: { unit: "business_day", value: 5 },
            },
          },
        },
      ],
      success_url: `${origin}/${locale}/boutique/merci?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/${locale}/boutique/panier`,
    });
    return { url: session.url };
  } catch (e) {
    return { error: e?.message || "error" };
  }
}
