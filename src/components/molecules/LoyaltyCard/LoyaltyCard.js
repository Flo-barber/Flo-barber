"use client";

import { useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import AddToGoogleWallet from "@/components/molecules/AddToGoogleWallet";
import "./LoyaltyCard.scss";

// Carte de fidélité : QR encodant l'identifiant du client, téléchargeable en PNG.
export default function LoyaltyCard({ clientId, name, points, walletEnabled }) {
  const wrapRef = useRef(null);

  function download() {
    const canvas = wrapRef.current?.querySelector("canvas");
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "carte-fidelite-flo-barber.png";
    a.click();
  }

  return (
    <div className="loyalty">
      <div className="loyalty-card">
        <div className="loyalty-card-head">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/wordmark.svg" alt="Flo Barber" className="loyalty-card-logo" />
          <span className="loyalty-card-tag">Carte de fidélité</span>
        </div>

        <div className="loyalty-card-qr" ref={wrapRef}>
          <QRCodeCanvas
            value={clientId}
            size={220}
            bgColor="#ffffff"
            fgColor="#0a0a0a"
            level="M"
            includeMargin
          />
        </div>

        <div className="loyalty-card-foot">
          <strong>{name || "Client"}</strong>
          <span>
            <b className="gold-text">{points}</b> point{points > 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <button type="button" className="btn btn-primary" onClick={download}>
        Télécharger ma carte (PNG)
      </button>

      {walletEnabled && <AddToGoogleWallet />}

      <p className="loyalty-hint">
        Présentez ce QR code au salon après votre prestation pour cumuler vos points.
      </p>
    </div>
  );
}
