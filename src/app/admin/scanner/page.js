"use client";

import { useCallback, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { creditPoints } from "../actions";

const QrScanner = dynamic(() => import("@/components/QrScanner"), {
  ssr: false,
  loading: () => <div className="qr-reader qr-reader--loading">Activation de la caméra…</div>,
});

export default function ScannerPage() {
  const [client, setClient] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const handleScan = useCallback(async (decoded) => {
    setScanning(false);
    setErr(null);
    setMsg(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, points")
      .eq("id", decoded)
      .maybeSingle();
    if (error || !data) {
      setErr("Client introuvable — ce QR code n'est pas une carte valide.");
      return;
    }
    setClient(data);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await creditPoints(client.id, amount);
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    setMsg(`+${res.points} point(s) crédité(s) à ${client.full_name || "ce client"}.`);
    setClient((c) => ({ ...c, points: c.points + res.points }));
    setAmount("");
  }

  function reset() {
    setClient(null);
    setScanning(true);
    setMsg(null);
    setErr(null);
    setAmount("");
  }

  return (
    <section className="scanner">
      <div className="container">
        <div className="scanner-head">
          <div>
            <p className="admin-eyebrow gold-text">Espace salon</p>
            <h1>Scanner une carte de fidélité</h1>
          </div>
          <Link href="/admin" className="btn btn-outline">
            ← Tableau de bord
          </Link>
        </div>

        {scanning && !client && (
          <div className="scanner-cam">
            <QrScanner onScan={handleScan} />
            <p className="scanner-hint">
              Placez le QR code du client dans le cadre.
            </p>
          </div>
        )}

        {err && (
          <div className="scanner-panel">
            <p className="auth-error">{err}</p>
            <button type="button" className="btn btn-primary" onClick={reset}>
              Réessayer
            </button>
          </div>
        )}

        {client && (
          <div className="scanner-panel">
            <div className="scanner-client">
              <span className="scanner-client-label">Client</span>
              <strong>{client.full_name || client.email || "Client"}</strong>
              <span className="scanner-client-points">
                Solde actuel : <b className="gold-text">{client.points}</b> pts
              </span>
            </div>

            {msg ? (
              <>
                <p className="auth-info">{msg}</p>
                <button type="button" className="btn btn-primary" onClick={reset}>
                  Scanner un autre client
                </button>
              </>
            ) : (
              <form onSubmit={submit} className="scanner-form">
                <label>
                  Montant payé (€)
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    autoFocus
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex : 23.50"
                  />
                </label>
                <p className="scanner-preview">
                  Points crédités :{" "}
                  <b className="gold-text">
                    {amount ? Math.floor(Number(String(amount).replace(",", ".")) || 0) : 0}
                  </b>
                </p>
                <div className="scanner-actions">
                  <button type="submit" className="btn btn-primary" disabled={busy}>
                    {busy ? "…" : "Créditer les points"}
                  </button>
                  <button type="button" className="btn btn-outline" onClick={reset}>
                    Annuler
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
