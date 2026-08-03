"use client";

import { useState } from "react";
import { useCart } from "@/cart/CartProvider";
import { useT } from "@/i18n/I18nProvider";
import "./AddToCart.scss";

export default function AddToCart({ slug, className = "" }) {
  const { add } = useCart();
  const t = useT();
  const [added, setAdded] = useState(false);

  function onAdd() {
    add(slug, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <button
      type="button"
      className={`btn btn-primary add-to-cart ${className}`}
      onClick={onAdd}
    >
      {added ? t("shop.added") : t("shop.addToCart")}
    </button>
  );
}
