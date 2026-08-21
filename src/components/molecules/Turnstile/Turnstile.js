"use client";

import { useEffect, useRef } from "react";
import "./Turnstile.scss";

// Clé publique du site (Cloudflare Turnstile). Si absente, le captcha est
// désactivé (pratique en dev) — la protection s'active dès qu'elle est définie.
export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || "";
export const CAPTCHA_ENABLED = !!TURNSTILE_SITE_KEY;

const SCRIPT_ID = "cf-turnstile-script";
const SCRIPT_SRC =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

// Widget captcha. Appelle onToken(token) quand l'utilisateur est validé (ou "" si
// erreur/expiration). Se remonte via une `key` côté parent pour obtenir un nouveau
// jeton (les jetons Turnstile sont à usage unique).
export default function Turnstile({ onToken, action }) {
  const ref = useRef(null);
  const widgetId = useRef(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY) return undefined;
    let cancelled = false;

    const render = () => {
      if (cancelled || !ref.current || !window.turnstile) return;
      widgetId.current = window.turnstile.render(ref.current, {
        sitekey: TURNSTILE_SITE_KEY,
        action,
        theme: "dark",
        callback: (token) => onToken(token),
        "error-callback": () => onToken(""),
        "expired-callback": () => onToken(""),
      });
    };

    if (window.turnstile) {
      render();
    } else {
      let s = document.getElementById(SCRIPT_ID);
      if (s) {
        s.addEventListener("load", render);
      } else {
        s = document.createElement("script");
        s.id = SCRIPT_ID;
        s.src = SCRIPT_SRC;
        s.async = true;
        s.defer = true;
        s.addEventListener("load", render);
        document.head.appendChild(s);
      }
    }

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current);
        } catch {
          // ignore
        }
      }
    };
  }, [onToken, action]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={ref} className="turnstile" />;
}
