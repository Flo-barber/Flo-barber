"use client";

import { useEffect } from "react";

export default function ServiceWorker() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      const register = () =>
        navigator.serviceWorker.register("/sw.js").catch(() => {});
      // On enregistre après le chargement pour ne pas gêner le premier rendu.
      if (document.readyState === "complete") register();
      else window.addEventListener("load", register, { once: true });
    }
  }, []);

  return null;
}
