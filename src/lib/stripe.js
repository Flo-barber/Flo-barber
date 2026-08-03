import Stripe from "stripe";

// Instance Stripe côté serveur uniquement. `null` si la clé n'est pas configurée
// (le site fonctionne alors sans paiement). Ne jamais exposer la clé au navigateur.
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;
