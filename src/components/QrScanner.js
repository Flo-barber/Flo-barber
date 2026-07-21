"use client";

import { useEffect, useRef } from "react";

// Lecteur de QR code via la caméra (librairie html5-qrcode chargée côté client).
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
