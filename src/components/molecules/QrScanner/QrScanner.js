"use client";

import { useEffect, useRef } from "react";

// Lecteur de QR code via la caméra (librairie html5-qrcode chargée côté client).
// NB : ce composant n'a pas de SCSS co-localisé. Sa classe `.qr-reader` reste
// dans `src/styles/_admin.scss` (global), car le fallback `loading` du
// `dynamic()` de la page scanner l'utilise AVANT que ce composant (et son CSS)
// ne soit chargé — un SCSS co-localisé laisserait le placeholder sans style.
export default function QrScanner({ onScan }) {
  const cbRef = useRef(onScan);
  cbRef.current = onScan;

  useEffect(() => {
    let scanner;
    let cancelled = false;
    let stopped = false;

    import("html5-qrcode")
      .then(({ Html5Qrcode }) => {
        if (cancelled) return;
        scanner = new Html5Qrcode("qr-reader");
        scanner
          .start(
            { facingMode: "environment" },
            { fps: 10, qrbox: { width: 240, height: 240 } },
            (decodedText) => {
              if (stopped) return;
              stopped = true;
              cbRef.current?.(decodedText.trim());
            },
            () => {}
          )
          .catch(() => {});
      })
      .catch(() => {});

    return () => {
      cancelled = true;
      if (scanner) {
        scanner
          .stop()
          .then(() => scanner.clear())
          .catch(() => {});
      }
    };
  }, []);

  return <div id="qr-reader" className="qr-reader" />;
}
