"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cancelCheckout } from "@/lib/shopActions";

// Au retour du client depuis Stripe sans avoir payé (cancel_url contient le
// session_id), on libère les points réservés puis on nettoie l'URL.
export default function CancelHandler({ sessionId }) {
  const done = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (done.current || !sessionId) return;
    done.current = true;
    cancelCheckout(sessionId).finally(() => {
      router.replace(pathname); // enlève ?session_id et rafraîchit le solde
    });
  }, [sessionId, router, pathname]);

  return null;
}
