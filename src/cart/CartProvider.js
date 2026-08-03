"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

// Panier côté client, persisté en localStorage. Items : [{ slug, qty }].
const CartContext = createContext(null);
const KEY = "flo-cart";

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const s = localStorage.getItem(KEY);
      if (s) setItems(JSON.parse(s));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }, [items, ready]);

  const add = useCallback((slug, qty = 1) => {
    setItems((cur) => {
      const found = cur.find((i) => i.slug === slug);
      if (found)
        return cur.map((i) =>
          i.slug === slug ? { ...i, qty: Math.min(20, i.qty + qty) } : i
        );
      return [...cur, { slug, qty: Math.min(20, qty) }];
    });
  }, []);

  const setQty = useCallback((slug, qty) => {
    setItems((cur) =>
      qty <= 0
        ? cur.filter((i) => i.slug !== slug)
        : cur.map((i) => (i.slug === slug ? { ...i, qty: Math.min(20, qty) } : i))
    );
  }, []);

  const remove = useCallback((slug) => {
    setItems((cur) => cur.filter((i) => i.slug !== slug));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.qty, 0);

  return (
    <CartContext.Provider
      value={{ items, add, setQty, remove, clear, count, ready }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
