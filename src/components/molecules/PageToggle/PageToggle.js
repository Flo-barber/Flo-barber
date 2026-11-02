"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Toast from "@/components/molecules/Toast";
import { setPageEnabled } from "@/lib/adminActions";
import { useT } from "@/i18n/I18nProvider";
import "./PageToggle.scss";

// Switch admin : affiche / masque une page optionnelle du site (et ses CTA).
export default function PageToggle({ slug, label, enabled: initial }) {
  const t = useT();
  const router = useRouter();
  const [enabled, setEnabled] = useState(initial);
  const [pending, startTransition] = useTransition();
  const [toast, setToast] = useState(null);

  function toggle() {
    const next = !enabled;
    setEnabled(next); // optimiste
    startTransition(async () => {
      const res = await setPageEnabled(slug, next);
      if (res?.error) {
        setEnabled(!next);
        setToast({ type: "error", message: res.error });
        return;
      }
      setToast({
        type: "success",
        message: t(next ? "admin.pageShown" : "admin.pageHidden", { page: label }),
      });
      router.refresh();
    });
  }

  return (
    <div className="page-toggle">
      <div className="page-toggle-text">
        <span className="page-toggle-label">{label}</span>
        <span className="page-toggle-state">
          {enabled ? t("admin.pageOn") : t("admin.pageOff")}
        </span>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-label={label}
        className={`page-toggle-switch ${enabled ? "is-on" : ""}`}
        onClick={toggle}
        disabled={pending}
      >
        <span className="page-toggle-knob" />
      </button>
      <Toast
        type={toast?.type}
        message={toast?.message}
        onClose={() => setToast(null)}
      />
    </div>
  );
}
