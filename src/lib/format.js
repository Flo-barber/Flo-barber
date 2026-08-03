// Helpers purs (utilisables côté serveur ET client).
export const SHIPPING_CENTS = 490;

export function formatEuro(cents, locale = "fr") {
  return new Intl.NumberFormat(locale === "en" ? "en-GB" : "fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format((cents || 0) / 100);
}
