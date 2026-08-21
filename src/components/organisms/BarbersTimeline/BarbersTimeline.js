"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n, useT } from "@/i18n/I18nProvider";
import "./BarbersTimeline.scss";

// Timeline verticale de l'équipe : chaque barbier apparaît au scroll, et une
// paire de ciseaux descend le long de la ligne au rythme du défilement.
// `barbers` est chargé depuis la base (Supabase) et passé par la page d'accueil.
export default function BarbersTimeline({ barbers = [] }) {
  const t = useT();
  const { locale } = useI18n();
  const timelineRef = useRef(null);
  const itemRefs = useRef([]);
  const [progress, setProgress] = useState(0); // 0 → 1 : position des ciseaux
  const [visible, setVisible] = useState(() => barbers.map(() => false));

  // Progression des ciseaux + révélation SYNCHRONISÉE : chaque barbier apparaît
  // (effet « découpe ») exactement quand les ciseaux atteignent sa position.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = timelineRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mid = window.innerHeight * 0.5;
      const p = Math.max(0, Math.min(1, (mid - rect.top) / rect.height));
      setProgress(p);

      const scissorsY = p * rect.height; // position des ciseaux (px depuis le haut)
      setVisible((cur) => {
        let changed = false;
        const next = cur.slice();
        itemRefs.current.forEach((it, i) => {
          if (!it) return;
          // Réversible : ouvert quand les ciseaux sont au niveau (ou plus bas) de
          // l'entrée, refermé quand ils repassent au-dessus (scroll vers le haut).
          const shouldShow = scissorsY >= it.offsetTop + 30;
          if (next[i] !== shouldShow) {
            next[i] = shouldShow;
            changed = true;
          }
        });
        return changed ? next : cur;
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const pct = `${(progress * 100).toFixed(2)}%`;

  // Aucun barbier actif → on masque la section.
  if (!barbers.length) return null;

  return (
    <section className="section barbers">
      <div className="container">
        <h2 className="section-title">
          {t("home.teamTitlePre")}
          <span className="gold-text">{t("home.teamTitleAccent")}</span>
        </h2>
        <p className="section-subtitle">{t("home.teamSub")}</p>

        <div className="bt-timeline" ref={timelineRef}>
          {/* Ligne + progression + ciseaux */}
          <div className="bt-line" aria-hidden="true">
            <div className="bt-line-fill" style={{ height: pct }} />
            <div className="bt-scissors" style={{ top: pct }}>
              <svg
                viewBox="0 0 24 24"
                width="26"
                height="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="6" cy="6" r="3" />
                <circle cx="6" cy="18" r="3" />
                <line x1="20" y1="4" x2="8.12" y2="15.88" />
                <line x1="14.47" y1="14.48" x2="20" y2="20" />
                <line x1="8.12" y1="8.12" x2="12" y2="12" />
              </svg>
            </div>
          </div>

          {barbers.map((b, i) => (
            <div
              key={b.name + i}
              ref={(el) => (itemRefs.current[i] = el)}
              data-index={i}
              className={`bt-item ${i % 2 === 0 ? "is-left" : "is-right"} ${
                visible[i] ? "is-visible" : ""
              }`}
            >
              <span className="bt-dot" aria-hidden="true" />
              <div className="bt-card">
                <div className="bt-photo">
                  {b.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.image} alt={b.name} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/monogram.svg" alt="" className="bt-photo-ph" />
                  )}
                </div>
                <div className="bt-info">
                  <h3 className="bt-name">{b.name}</h3>
                  <p className="bt-role">{b.role[locale] || b.role.fr}</p>
                  <p className="bt-bio">{b.bio[locale] || b.bio.fr}</p>
                </div>
                {/* Volets « découpe » qui recouvrent TOUTE la carte et s'ouvrent
                    au centre à la révélation. */}
                <span className="bt-card-cut" aria-hidden="true" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
