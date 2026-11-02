"use client";

import { useState } from "react";
import { useT } from "@/i18n/I18nProvider";
import "./PasswordInput.scss";

// Champ mot de passe avec bouton « œil » pour afficher / masquer la saisie.
// Toutes les props sont transmises à l'<input>.
export default function PasswordInput(props) {
  const [visible, setVisible] = useState(false);
  const t = useT();
  const label = visible ? t("auth.hidePassword") : t("auth.showPassword");

  return (
    <span className="password-input">
      <input {...props} type={visible ? "text" : "password"} />
      <button
        type="button"
        className="password-input-toggle"
        aria-label={label}
        aria-pressed={visible}
        title={label}
        onClick={() => setVisible((v) => !v)}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
          {visible && <path d="M4 4l16 16" />}
        </svg>
      </button>
    </span>
  );
}
