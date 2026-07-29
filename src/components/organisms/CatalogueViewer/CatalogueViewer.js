"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import Link from "@/i18n/Link";
import { useI18n, useT } from "@/i18n/I18nProvider";
import catalogue from "@/data/catalogue.json";
import "./CatalogueViewer.scss";

// Layout effect côté client (évite l'avertissement SSR), pour lancer les
// animations AVANT le paint et supprimer le saut d'une frame.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Roue des titres (gauche) : hauteur d'un cran (cohérent avec le SCSS).
const ROW_H = 58;
const LIST_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
// Carrousel photo (centre) : marge d'aperçu haut/bas + écart (cohérent SCSS).
const PHOTO_PEEK = 72;
const PHOTO_GAP = 14;
const PHOTO_OFFSETS = [-2, -1, 0, 1, 2];

export default function CatalogueViewer() {
  const { locale } = useI18n();
  const t = useT();

  const cuts = catalogue.cuts;
  const n = cuts.length;
  const productsBySlug = Object.fromEntries(
    catalogue.products.map((p) => [p.slug, p])
  );

  const [active, setActive] = useState(0);
  const [photo, setPhoto] = useState(0);

  const listRef = useRef(null);
  const listTrackRef = useRef(null);
  const photoRef = useRef(null);
  const photoTrackRef = useRef(null);
  const dirRef = useRef(1);
  const lockRef = useRef(0);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);

  const cut = cuts[active];
  const images = cut.images;
  const safePhoto = photo < images.length ? photo : 0;

  const mod = (x) => ((x % n) + n) % n;

  // Précharge toutes les photos → changement de photo instantané (pas de re-décodage).
  useEffect(() => {
    cuts.forEach((c) =>
      c.images.forEach((im) => {
        const img = new Image();
        img.src = im.src;
      })
    );
  }, [cuts]);

  const go = useCallback(
    (delta) => {
      if (!delta) return;
      dirRef.current = delta > 0 ? 1 : -1;
      setActive((a) => mod(a + delta));
    },
    [n] // eslint-disable-line react-hooks/exhaustive-deps
  );

  // Changement de coupe → photo principale + animation de défilement (liste + photo).
  // useLayoutEffect : lance les animations AVANT le paint pour éviter tout saut.
  useIsoLayoutEffect(() => {
    setPhoto(0);
    const dir = dirRef.current;
    const opts = {
      duration: 380,
      easing: "cubic-bezier(0.33, 1, 0.68, 1)", // ease-out doux
      fill: "backwards",
    };
    listTrackRef.current?.animate(
      [{ transform: `translateY(${dir * ROW_H}px)` }, { transform: "translateY(0)" }],
      opts
    );
    const vp = photoRef.current;
    if (photoTrackRef.current && vp) {
      const step = vp.clientHeight - 2 * PHOTO_PEEK + PHOTO_GAP;
      photoTrackRef.current.animate(
        [{ transform: `translateY(${dir * step}px)` }, { transform: "translateY(0)" }],
        opts
      );
    }
  }, [active]);

  // Molette (non passive → on bloque le scroll de page) sur liste + photo.
  useEffect(() => {
    const els = [listRef.current, photoRef.current].filter(Boolean);
    const onWheel = (e) => {
      e.preventDefault();
      if (Math.abs(e.deltaY) < 12) return; // ignore les micro-défilements
      const now = Date.now();
      if (now - lockRef.current < 550) return; // 1 cran max toutes les 550 ms
      lockRef.current = now;
      go(e.deltaY > 0 ? 1 : -1);
    };
    els.forEach((el) => el.addEventListener("wheel", onWheel, { passive: false }));
    return () => els.forEach((el) => el.removeEventListener("wheel", onWheel));
  }, [go]);

  // Glisser vertical (souris / tactile) — SANS pointer capture pour ne pas
  // avaler les clics sur les titres et les boutons photo.
  function onPointerDown(e) {
    dragRef.current = { y: e.clientY };
    draggedRef.current = false;
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const dy = e.clientY - dragRef.current.y;
    if (Math.abs(dy) > ROW_H * 0.6) {
      go(dy < 0 ? 1 : -1);
      dragRef.current.y = e.clientY;
      draggedRef.current = true;
    }
  }
  function onPointerUp() {
    dragRef.current = null;
  }
  function onKeyDown(e) {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      go(1);
    }
  }

  // Clic sur un titre → va à cette coupe (sauf si c'était un glissement).
  function onTitleClick(offset) {
    if (draggedRef.current) {
      draggedRef.current = false;
      return;
    }
    go(offset);
  }

  function prevPhoto(e) {
    e.stopPropagation();
    setPhoto((p) => {
      const cur = p < images.length ? p : 0;
      return (cur - 1 + images.length) % images.length;
    });
  }
  function nextPhoto(e) {
    e.stopPropagation();
    setPhoto((p) => {
      const cur = p < images.length ? p : 0;
      return (cur + 1) % images.length;
    });
  }

  const dragHandlers = {
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
  };

  return (
    <div className="catalogue-viewer">
      {/* GAUCHE : roue infinie des titres (toujours 3 au-dessus / 3 en dessous) */}
      <div
        className="cv-list"
        ref={listRef}
        tabIndex={0}
        role="listbox"
        aria-label={t("cataloguePage.cut")}
        onKeyDown={onKeyDown}
        {...dragHandlers}
      >
        <div className="cv-list-track" ref={listTrackRef}>
          {LIST_OFFSETS.map((o) => {
            const idx = mod(active + o);
            const c = cuts[idx];
            const ad = Math.abs(o);
            const scale = Math.max(1 - ad * 0.14, 0.5);
            const opacity = ad >= 4 ? 0 : Math.max(1 - ad * 0.3, 0.12);
            return (
              <button
                key={o}
                type="button"
                className={`cv-list-btn ${o === 0 ? "active" : ""}`}
                style={{
                  transform: `translateY(calc(-50% + ${o * ROW_H}px)) scale(${scale})`,
                  opacity,
                }}
                aria-selected={o === 0}
                onClick={() => onTitleClick(o)}
              >
                <span className="cv-list-index">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <span className="cv-list-title">{c.title[locale]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CENTRE : carrousel photo avec aperçu haut/bas */}
      <div className="cv-photo" ref={photoRef} {...dragHandlers}>
        <div className="cv-photo-track" ref={photoTrackRef}>
          {PHOTO_OFFSETS.map((o) => {
            const idx = mod(active + o);
            const c = cuts[idx];
            const isActive = o === 0;
            const img = isActive ? c.images[safePhoto] || c.images[0] : c.images[0];
            return (
              <div
                key={o}
                className={`cv-photo-slide ${isActive ? "is-active" : ""}`}
                style={{
                  transform: `translateY(calc(-50% + ${o} * (var(--slide-h) + var(--pgap))))`,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  key={`img${o}`}
                  src={img.src}
                  alt={img.alt[locale]}
                  className="cv-photo-img"
                  decoding="async"
                />
                {isActive && c.images.length > 1 && (
                  <div className="cv-photo-controls">
                    <button
                      type="button"
                      className="cv-photo-nav"
                      onClick={prevPhoto}
                      aria-label={t("cataloguePage.prevPhoto")}
                    >
                      ‹
                    </button>
                    <span className="cv-photo-count">
                      {safePhoto + 1} / {c.images.length}
                    </span>
                    <button
                      type="button"
                      className="cv-photo-nav"
                      onClick={nextPhoto}
                      aria-label={t("cataloguePage.nextPhoto")}
                    >
                      ›
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* DROITE : description + produits */}
      <div className="cv-desc">
        <p className="cv-desc-eyebrow">
          {t("cataloguePage.cut")} {String(active + 1).padStart(2, "0")}
        </p>
        <h2 className="cv-desc-title">{cut.title[locale]}</h2>
        <p className="cv-desc-text">{cut.description[locale]}</p>

        {images.length > 1 && (
          <div className="cv-thumbs">
            {images.map((img, i) => (
              <button
                key={i}
                type="button"
                className={`cv-thumb ${i === safePhoto ? "active" : ""}`}
                onClick={() => setPhoto(i)}
                aria-label={`${t("cataloguePage.photo")} ${i + 1}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.src} alt="" />
              </button>
            ))}
          </div>
        )}

        <div className="cv-products">
          <h3 className="cv-products-title">{t("cataloguePage.productsUsed")}</h3>
          <ul className="cv-products-list">
            {cut.products.map((slug) => {
              const p = productsBySlug[slug];
              if (!p) return null;
              return (
                <li key={slug}>
                  <Link href={`/boutique/${slug}`} className="cv-product">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.image} alt="" className="cv-product-img" />
                    <span className="cv-product-info">
                      <span className="cv-product-name">{p.name[locale]}</span>
                      <span className="cv-product-tag">{p.tagline[locale]}</span>
                    </span>
                    <span className="cv-product-price">{p.price}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
