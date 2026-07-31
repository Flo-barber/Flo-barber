"use client";

import { useEffect, useState } from "react";
import Link from "@/i18n/Link";
import { useT } from "@/i18n/I18nProvider";
import "./CookieNotice.scss";

// Bandeau informatif (pas un mur de consentement) : le site n'utilise que des
// cookies techniques nécessaires, exemptés de consentement. On informe + on
// mémorise la fermeture pour ne pas ré-afficher.
const KEY = "flo-cookie-notice";

export default function CookieNotice() {
  const t = useT();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-notice" role="region" aria-label="Cookies">
      <p className="cookie-notice-text">
        {t("cookie.text")}{" "}
        <Link href="/confidentialite" className="cookie-notice-link">
          {t("cookie.more")}
        </Link>
      </p>
      <button type="button" className="cookie-notice-btn" onClick={dismiss}>
        {t("cookie.accept")}
      </button>
    </div>
  );
}
