"use client";

import { useRouter } from "next/navigation";
import { useLocalePath } from "@/i18n/useLocalePath";
import ArrowLeft from "@/components/atoms/ArrowLeft";

// Bouton « retour en arrière » : revient à la page précédente (catalogue, boutique…)
// via l'historique du navigateur. Repli sur `fallback` si on est arrivé
// directement sur la page (pas d'historique interne, ex. lien externe / refresh).
export default function BackButton({
  children,
  className = "",
  fallback = "/",
  arrowSize = 18,
}) {
  const router = useRouter();
  const localePath = useLocalePath();

  function handleBack() {
    // S'il y a une page précédente dans l'onglet (navigation interne : catalogue,
    // boutique…), on y revient. Sinon (arrivée directe / nouvel onglet), repli.
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(localePath(fallback));
    }
  }

  return (
    <button type="button" className={className} onClick={handleBack}>
      <ArrowLeft size={arrowSize} />
      {children}
    </button>
  );
}
