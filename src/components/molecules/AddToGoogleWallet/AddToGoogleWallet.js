"use client";

import { useState } from "react";
import { getWalletSaveUrl } from "@/lib/walletActions";
import { useT } from "@/i18n/I18nProvider";
import "./AddToGoogleWallet.scss";

export default function AddToGoogleWallet() {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function add() {
    setBusy(true);
    setErr(null);
    const res = await getWalletSaveUrl();
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    window.open(res.url, "_blank", "noopener");
  }

  return (
    <>
      <button
        type="button"
        className="wallet-btn"
        onClick={add}
        disabled={busy}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path
            fill="currentColor"
            d="M21 7H3a1 1 0 0 0-1 1v8a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1Zm-1 9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4h16Zm0-6H4V9h16Z"
          />
          <path fill="currentColor" d="M6 5h10a1 1 0 0 1 0 2H6a1 1 0 0 1 0-2Z" />
        </svg>
        {busy ? "…" : t("wallet.add")}
      </button>
      {err && <p className="auth-error">{err}</p>}
    </>
  );
}
