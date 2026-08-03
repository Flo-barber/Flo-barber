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
import { formatEuro } from "@/lib/format";
import "./CatalogueViewer.scss";

// Layout effect côté client (évite l'avertissement SSR), pour lancer les
// animations AVANT le paint et supprimer le saut d'une frame.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

// Roue des titres : pas d'un cran — vertical (desktop) ou horizontal (mobile).
const ROW_H = 58; // pas vertical (desktop)
const COL_W = 150; // pas horizontal (mobile)
const LIST_OFFSETS = [-4, -3, -2, -1, 0, 1, 2, 3, 4];
// Carrousel photo (centre) : marge d'aperçu + écart (cohérent SCSS).
const PHOTO_PEEK = 72; // aperçu vertical (desktop)
const PHOTO_PEEK_H = 28; // aperçu horizontal (mobile) — plus petit = photo centrale plus large
const PHOTO_GAP = 14;
const PHOTO_OFFSETS = [-2, -1, 0, 1, 2];

export default function CatalogueViewer({ products = {} }) {
  const { locale } = useI18n();
  const t = useT();

  const cuts = catalogue.cuts;
  const n = cuts.length;
  const productsBySlug = products || {};

  const [active, setActive] = useState(0);
  const [photo, setPhoto] = useState(0);
  const [horizontal, setHorizontal] = useState(false); // roue horizontale en mobile

  // Détecte le passage en mode mobile (roue de titres horizontale).
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 980px)");
    const update = () => setHorizontal(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const listRef = useRef(null);
  const listTrackRef = useRef(null);
  const photoRef = useRef(null);
  const photoTrackRef = useRef(null);
  const dirRef = useRef(1);
  const lockRef = useRef(0);
  const dragRef = useRef(null);
  const draggedRef = useRef(false);
  const fracRef = useRef(0); // position du drag en fraction d'un cran (-1..1)
  const dragAnimsRef = useRef([]); // animations de snap en cours
  const suppressAnimRef = useRef(false); // saute l'anim standard lors d'un commit de drag

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

    // Commit d'un drag : le snap a déjà positionné les pistes sur la coupe voisine.
    // On recentre juste le contenu (transforms remis à 0) sans rejouer d'animation.
    if (suppressAnimRef.current) {
      suppressAnimRef.current = false;
      dragAnimsRef.current.forEach((a) => a && a.cancel());
      dragAnimsRef.current = [];
      if (listTrackRef.current) listTrackRef.current.style.transform = "";
      if (photoTrackRef.current) photoTrackRef.current.style.transform = "";
      fracRef.current = 0;
      return;
    }

    const dir = dirRef.current;
    const opts = {
      duration: 380,
      easing: "cubic-bezier(0.33, 1, 0.68, 1)", // ease-out doux
      fill: "backwards",
    };
    const listAxis = horizontal ? "X" : "Y";
    const listStep = horizontal ? COL_W : ROW_H;
    if (listTrackRef.current) {
      listTrackRef.current.style.transform = "";
      listTrackRef.current.animate(
        [
          { transform: `translate${listAxis}(${dir * listStep}px)` },
          { transform: `translate${listAxis}(0)` },
        ],
        opts
      );
    }
    const vp = photoRef.current;
    if (photoTrackRef.current && vp) {
      const axis = horizontal ? "X" : "Y";
      const size = horizontal ? vp.clientWidth : vp.clientHeight;
      const peek = horizontal ? PHOTO_PEEK_H : PHOTO_PEEK;
      const step = size - 2 * peek + PHOTO_GAP;
      photoTrackRef.current.style.transform = "";
      photoTrackRef.current.animate(
        [
          { transform: `translate${axis}(${dir * step}px)` },
          { transform: `translate${axis}(0)` },
        ],
        opts
      );
    }
  }, [active]);

  // Largeur d'une photo en mode horizontal (mesurée → offsets translateX exacts).
  useIsoLayoutEffect(() => {
    const vp = photoRef.current;
    if (!vp) return;
    const set = () =>
      vp.style.setProperty("--slide-w", `${vp.clientWidth - 2 * PHOTO_PEEK_H}px`);
    set();
    window.addEventListener("resize", set);
    return () => window.removeEventListener("resize", set);
  }, [horizontal]);

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

  // --- Drag suivi (les pistes suivent le doigt, max 1 section, snap au relâchement) ---
  const listStepPx = () => (horizontal ? COL_W : ROW_H);
  const photoStepPx = () => {
    const vp = photoRef.current;
    if (!vp) return 300;
    const size = horizontal ? vp.clientWidth : vp.clientHeight;
    const peek = horizontal ? PHOTO_PEEK_H : PHOTO_PEEK;
    return size - 2 * peek + PHOTO_GAP;
  };
  const setTrackOffset = (frac) => {
    const axis = horizontal ? "X" : "Y";
    if (listTrackRef.current)
      listTrackRef.current.style.transform = `translate${axis}(${frac * listStepPx()}px)`;
    if (photoTrackRef.current)
      photoTrackRef.current.style.transform = `translate${axis}(${frac * photoStepPx()}px)`;
  };

  const startDrag = (source) => (e) => {
    dragAnimsRef.current.forEach((a) => a && a.cancel());
    dragAnimsRef.current = [];
    dragRef.current = { x: e.clientX, y: e.clientY, source };
    draggedRef.current = false;
    fracRef.current = 0;
  };
  function onPointerMove(e) {
    if (!dragRef.current) return;
    const delta = horizontal
      ? e.clientX - dragRef.current.x
      : e.clientY - dragRef.current.y;
    if (Math.abs(delta) > 4) draggedRef.current = true;
    const step = dragRef.current.source === "photo" ? photoStepPx() : listStepPx();
    // Borné à ±1 : on ne peut avancer que d'une seule section par glissement.
    const frac = Math.max(-1, Math.min(1, delta / step));
    fracRef.current = frac;
    setTrackOffset(frac);
  }
  function onPointerUp() {
    if (!dragRef.current) return;
    dragRef.current = null;
    const frac = fracRef.current;
    const axis = horizontal ? "X" : "Y";
    const commit = Math.abs(frac) > 0.3; // au-delà de 30 % → on change de coupe
    const sign = frac > 0 ? 1 : -1;
    const lStep = listStepPx();
    const pStep = photoStepPx();
    const lTo = commit ? sign * lStep : 0;
    const pTo = commit ? sign * pStep : 0;
    const remaining = commit ? 1 - Math.abs(frac) : Math.abs(frac);
    const opts = {
      duration: Math.max(120, remaining * 320),
      easing: "cubic-bezier(0.33, 1, 0.68, 1)",
      fill: "forwards",
    };
    const aL = listTrackRef.current?.animate(
      [
        { transform: `translate${axis}(${frac * lStep}px)` },
        { transform: `translate${axis}(${lTo}px)` },
      ],
      opts
    );
    const aP = photoTrackRef.current?.animate(
      [
        { transform: `translate${axis}(${frac * pStep}px)` },
        { transform: `translate${axis}(${pTo}px)` },
      ],
      opts
    );
    dragAnimsRef.current = [aL, aP].filter(Boolean);
    const finish = () => {
      if (commit) {
        // Fige la position d'arrivée (pixels identiques à la coupe voisine centrée),
        // puis change `active` : le layout effect recentrera le contenu sans à-coup.
        if (listTrackRef.current)
          listTrackRef.current.style.transform = `translate${axis}(${lTo}px)`;
        if (photoTrackRef.current)
          photoTrackRef.current.style.transform = `translate${axis}(${pTo}px)`;
        suppressAnimRef.current = true;
        dirRef.current = -sign;
        setActive((a) => mod(a - sign));
      } else {
        dragAnimsRef.current.forEach((a) => a && a.cancel());
        dragAnimsRef.current = [];
        if (listTrackRef.current) listTrackRef.current.style.transform = "";
        if (photoTrackRef.current) photoTrackRef.current.style.transform = "";
        fracRef.current = 0;
      }
    };
    if (aP) aP.onfinish = finish;
    else if (aL) aL.onfinish = finish;
    else finish();
  }
  function onKeyDown(e) {
    if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      go(-1);
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
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

  const listDrag = {
    onPointerDown: startDrag("list"),
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onPointerCancel: onPointerUp,
  };
  const photoDrag = {
    onPointerDown: startDrag("photo"),
    onPointerMove,
    onPointerUp,
    onPointerLeave: onPointerUp,
    onPointerCancel: onPointerUp,
  };

  return (
    <div className="catalogue-viewer">
      {/* GAUCHE : roue infinie des titres (toujours 3 au-dessus / 3 en dessous) */}
      <div
        className={`cv-list ${horizontal ? "is-horizontal" : ""}`}
        ref={listRef}
        tabIndex={0}
        role="listbox"
        aria-label={t("cataloguePage.cut")}
        onKeyDown={onKeyDown}
        {...listDrag}
      >
        <div className="cv-list-track" ref={listTrackRef}>
          {LIST_OFFSETS.map((o) => {
            const idx = mod(active + o);
            const c = cuts[idx];
            const ad = Math.abs(o);
            const scale = Math.max(1 - ad * 0.14, 0.5);
            const opacity = ad >= 4 ? 0 : Math.max(1 - ad * 0.3, 0.12);
            const transform = horizontal
              ? `translate(calc(-50% + ${o * COL_W}px), -50%) scale(${scale})`
              : `translateY(calc(-50% + ${o * ROW_H}px)) scale(${scale})`;
            return (
              <button
                key={o}
                type="button"
                className={`cv-list-btn ${o === 0 ? "active" : ""}`}
                style={{ transform, opacity }}
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

      {/* CENTRE : carrousel photo avec aperçu (haut/bas en desktop, gauche/droite en mobile) */}
      <div
        className={`cv-photo ${horizontal ? "is-horizontal" : ""}`}
        ref={photoRef}
        {...photoDrag}
      >
        <div className="cv-photo-track" ref={photoTrackRef}>
          {PHOTO_OFFSETS.map((o) => {
            const idx = mod(active + o);
            const c = cuts[idx];
            const isActive = o === 0;
            const img = isActive ? c.images[safePhoto] || c.images[0] : c.images[0];
            const photoTransform = horizontal
              ? `translate(calc(-50% + ${o} * (var(--slide-w) + var(--pgap))), -50%)`
              : `translateY(calc(-50% + ${o} * (var(--slide-h) + var(--pgap))))`;
            return (
              <div
                key={o}
                className={`cv-photo-slide ${isActive ? "is-active" : ""}`}
                style={{ transform: photoTransform }}
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
                    <span className="cv-product-price">
                      {formatEuro(p.priceCents, locale)}
                    </span>
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
