"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { deleteAccount } from "@/lib/accountActions";
import { useT } from "@/i18n/I18nProvider";
import { useLocalePath } from "@/i18n/useLocalePath";
import "./DeleteAccountButton.scss";

// RGPD — droit à l'effacement : suppression du compte par l'utilisateur lui-même.
export default function DeleteAccountButton() {
  const t = useT();
  const router = useRouter();
  const localePath = useLocalePath();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function onDelete() {
    if (!window.confirm(t("account.deleteConfirm"))) return;
    setBusy(true);
    setErr(null);
    const res = await deleteAccount();
    if (res?.error) {
      setErr(res.error);
      setBusy(false);
      return;
    }
    try {
      await createClient().auth.signOut();
    } catch {
      // ignore
    }
    router.push(localePath("/"));
    router.refresh();
  }

  return (
    <div className="delete-account">
      <h2 className="delete-account-title">{t("account.dangerZone")}</h2>
      <p className="delete-account-hint">{t("account.deleteHint")}</p>
      {err && <p className="auth-error">{err}</p>}
      <button
        type="button"
        className="delete-account-btn"
        onClick={onDelete}
        disabled={busy}
      >
        {busy ? t("account.deleting") : t("account.deleteButton")}
      </button>
    </div>
  );
}
