"use client";

import { useEffect } from "react";
import "./Toast.scss";

// Petite notification flottante (succès / erreur), auto-fermeture après `duration`.
export default function Toast({ type = "success", message, onClose, duration = 3200 }) {
  useEffect(() => {
    if (!message) return undefined;
    const id = setTimeout(() => onClose && onClose(), duration);
    return () => clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className={`toast toast--${type}`} role="status" aria-live="polite">
      <span className="toast-icon" aria-hidden="true">
        {type === "error" ? "!" : "✓"}
      </span>
      <span className="toast-msg">{message}</span>
      <button
        type="button"
        className="toast-close"
        onClick={onClose}
        aria-label="Fermer"
      >
        ×
      </button>
    </div>
  );
}
