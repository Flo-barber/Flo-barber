"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "@/i18n/Link";
import { createClient } from "@/lib/supabase/client";
import { creditPoints, redeemPointsAdmin } from "@/lib/adminActions";
import { useI18n, useT } from "@/i18n/I18nProvider";
import { formatEuro, pointsToCents, POINT_MIN_REDEEM } from "@/lib/format";

export default function ScannerPage() {
  const t = useT();
  const { locale } = useI18n();
  const [client, setClient] = useState(null);
  const [scanning, setScanning] = useState(true);
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState("credit"); // 'credit' | 'redeem'
  const [redeemPts, setRedeemPts] = useState("");
  const [msg, setMsg] = useState(null);
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const QrScanner = useMemo(
    () =>
      dynamic(() => import("@/components/molecules/QrScanner"), {
        ssr: false,
        loading: () => <div className="qr-reader qr-reader--loading">…</div>,
      }),
    []
  );

  const handleScan = useCallback(
    async (decoded) => {
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
        setErr(t("scanner.notFound"));
        return;
      }
      setClient(data);
    },
    [t]
  );

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
    setMsg(
      t("scanner.credited", {
        points: res.points,
        name: client.full_name || t("scanner.clientFallback"),
      })
    );
    setClient((c) => ({ ...c, points: c.points + res.points }));
    setAmount("");
  }

  async function submitRedeem(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    const res = await redeemPointsAdmin(client.id, redeemPts);
    setBusy(false);
    if (res?.error) {
      setErr(res.error);
      return;
    }
    setMsg(
      t("scanner.redeemed", {
        points: res.points,
        value: formatEuro(res.cents, locale),
        name: client.full_name || t("scanner.clientFallback"),
      })
    );
    setClient((c) => ({ ...c, points: c.points - res.points }));
    setRedeemPts("");
  }

  function reset() {
    setClient(null);
    setScanning(true);
    setMsg(null);
    setErr(null);
    setAmount("");
    setRedeemPts("");
    setMode("credit");
  }

  return (
    <section className="scanner">
      <div className="container">
        <div className="scanner-head">
          <div>
            <p className="admin-eyebrow gold-text">{t("scanner.eyebrow")}</p>
            <h1>{t("scanner.title")}</h1>
          </div>
          <Link href="/admin" className="btn btn-outline">
            {t("scanner.back")}
          </Link>
        </div>

        {scanning && !client && (
          <div className="scanner-cam">
            <QrScanner onScan={handleScan} />
            <p className="scanner-hint">{t("scanner.hint")}</p>
          </div>
        )}

        {err && (
          <div className="scanner-panel">
            <p className="auth-error">{err}</p>
            <button type="button" className="btn btn-primary" onClick={reset}>
              {t("scanner.retry")}
            </button>
          </div>
        )}

        {client && (
          <div className="scanner-panel">
            <div className="scanner-client">
              <span className="scanner-client-label">{t("scanner.clientLabel")}</span>
              <strong>{client.full_name || client.email || t("scanner.clientFallback")}</strong>
              <span className="scanner-client-points">
                {t("scanner.balance")}{" "}
                <b className="gold-text">{client.points}</b> {t("scanner.pts")}
              </span>
            </div>

            {msg ? (
              <>
                <p className="auth-info">{msg}</p>
                <button type="button" className="btn btn-primary" onClick={reset}>
                  {t("scanner.scanAnother")}
                </button>
              </>
            ) : (
              <>
                <div className="scanner-modes">
                  <button
                    type="button"
                    className={mode === "credit" ? "is-active" : ""}
                    onClick={() => {
                      setMode("credit");
                      setErr(null);
                    }}
                  >
                    {t("scanner.modeCredit")}
                  </button>
                  <button
                    type="button"
                    className={mode === "redeem" ? "is-active" : ""}
                    onClick={() => {
                      setMode("redeem");
                      setErr(null);
                    }}
                  >
                    {t("scanner.modeRedeem")}
                  </button>
                </div>

                {mode === "credit" ? (
                  <form onSubmit={submit} className="scanner-form">
                    <label>
                      {t("scanner.amountLabel")}
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        autoFocus
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder={t("scanner.amountPlaceholder")}
                      />
                    </label>
                    <p className="scanner-preview">
                      {t("scanner.pointsPreview")}{" "}
                      <b className="gold-text">
                        {amount
                          ? Math.floor(Number(String(amount).replace(",", ".")) || 0)
                          : 0}
                      </b>
                    </p>
                    <div className="scanner-actions">
                      <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? "…" : t("scanner.credit")}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={reset}>
                        {t("scanner.cancel")}
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={submitRedeem} className="scanner-form">
                    <label>
                      {t("scanner.redeemLabel")}
                      <input
                        type="number"
                        min={POINT_MIN_REDEEM}
                        max={client.points}
                        step="1"
                        required
                        autoFocus
                        value={redeemPts}
                        onChange={(e) => setRedeemPts(e.target.value)}
                        placeholder={String(POINT_MIN_REDEEM)}
                      />
                    </label>
                    <p className="scanner-preview">
                      {t("scanner.redeemPreview")}{" "}
                      <b className="gold-text">
                        {formatEuro(
                          pointsToCents(Math.floor(Number(redeemPts) || 0)),
                          locale
                        )}
                      </b>
                    </p>
                    <div className="scanner-actions">
                      <button type="submit" className="btn btn-primary" disabled={busy}>
                        {busy ? "…" : t("scanner.redeem")}
                      </button>
                      <button type="button" className="btn btn-outline" onClick={reset}>
                        {t("scanner.cancel")}
                      </button>
                    </div>
                  </form>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
