// Helpers purs (utilisables côté serveur ET client).
export const SHIPPING_CENTS = 490;

// --- Programme de fidélité "Flo Points" ---
// 1 € dépensé = 1 Flo Point (gain). 1 Flo Point = 0,05 € de valeur (remise).
export const POINT_VALUE_CENTS = 5; // valeur d'1 point, en centimes
export const POINT_MIN_REDEEM = 100; // utilisation possible à partir de 100 points
// Montant minimum qui doit rester payable par carte (contrainte Stripe, EUR).
export const STRIPE_MIN_CENTS = 50;

export function formatEuro(cents, locale = "fr") {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}

// Valeur en centimes d'un nombre de points.
export function pointsToCents(points) {
  return Math.max(0, Math.floor(points || 0)) * POINT_VALUE_CENTS;
}

// Nombre maximum de points utilisables sur une commande, de sorte qu'il reste
// au moins STRIPE_MIN_CENTS à payer. Renvoie 0 si l'ordre est trop petit.
export function maxRedeemablePoints(totalCents) {
  const room = (totalCents || 0) - STRIPE_MIN_CENTS;
  if (room <= 0) return 0;
  return Math.floor(room / POINT_VALUE_CENTS);
}
