"use client";

import { useEffect } from "react";
import { useCart } from "@/cart/CartProvider";

// Vide le panier une fois la commande payée (page de remerciement).
// On attend `ready` : sinon, au rechargement complet (retour de Stripe), le vidage
// s'exécuterait AVANT que le provider ait lu le localStorage, qui rechargerait
// ensuite l'ancien panier par-dessus.
export default function ClearCartOnMount() {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  return null;
}
