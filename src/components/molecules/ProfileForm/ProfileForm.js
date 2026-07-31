"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useT } from "@/i18n/I18nProvider";
import "./ProfileForm.scss";

// RGPD — droit de rectification : l'utilisateur modifie son nom et son téléphone.
// La sécurité base (RLS + grant update (full_name, phone)) garantit qu'il ne peut
// pas toucher aux points ni aux données d'autrui.
export default function ProfileForm({ userId, initialName, initialPhone, email }) {
  const t = useT();
  const router = useRouter();
  const [fullName, setFullName] = useState(initialName || "");
  const [phone, setPhone] = useState(initialPhone || "");
  const [status, setStatus] = useState(null);
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);

  // Bouton actif seulement s'il y a une modification.
  const dirty =
    fullName.trim() !== (initialName || "").trim() ||
    phone.trim() !== (initialPhone || "").trim();

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setMsg(null);
    setErr(null);
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim(), phone: phone.trim() })
      .eq("id", userId);
    setStatus(null);
    if (error) {
      setErr(t("account.saveError"));
      return;
    }
    setMsg(t("account.saved"));
    router.refresh();
  }

  return (
    <form className="account-info profile-form" onSubmit={onSubmit}>
      <h2>{t("account.infoTitle")}</h2>

      <label className="profile-field">
        {t("account.name")}
        <input
          type="text"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            setMsg(null);
          }}
          autoComplete="name"
        />
      </label>

      <label className="profile-field">
        {t("account.phone")}
        <input
          type="tel"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setMsg(null);
          }}
          autoComplete="tel"
        />
      </label>

      <div className="profile-field">
        <span>{t("account.email")}</span>
        <input type="email" value={email} disabled />
        <small className="profile-note">{t("account.emailNote")}</small>
      </div>

      {msg && <p className="auth-info">{msg}</p>}
      {err && <p className="auth-error">{err}</p>}

      <button
        type="submit"
        className="btn btn-primary profile-save"
        disabled={!dirty || status === "loading"}
      >
        {status === "loading" ? "…" : t("account.save")}
      </button>
    </form>
  );
}
