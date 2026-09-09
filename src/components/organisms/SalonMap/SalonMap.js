"use client";

// =============================================================
//  ⚠️ CONTRAINTE — maplibre-gl est FIGÉ en v4.
//  Le fond de carte vectoriel (OpenFreeMap) est rendu via le pont
//  @maplibre/maplibre-gl-leaflet, qui lit `map.transform` — un interne
//  supprimé de l'API publique de MapLibre en v5+. En v5/v6, la carte
//  ne demande aucune tuile et reste NOIRE.
//  → Ne pas mettre à jour maplibre-gl au-delà de la v4 sans remplacer
//    ce pont (ou revenir à un TileLayer raster, ex. CARTO avec clé).
// =============================================================

import { useEffect, useRef } from "react";
import { MapContainer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import * as maplibregl from "maplibre-gl";
import "@maplibre/maplibre-gl-leaflet";
import { useT } from "@/i18n/I18nProvider";
import "leaflet/dist/leaflet.css";
import "maplibre-gl/dist/maplibre-gl.css";
import "./SalonMap.scss"; // après leaflet.css : nos overrides priment par cascade

// Le plugin maplibre-gl-leaflet référence le global `maplibregl`.
if (typeof window !== "undefined") window.maplibregl = maplibregl;

// Marqueur doré "FB" personnalisé (évite le bug des icônes par défaut de Leaflet)
function fbIcon(active) {
  return L.divIcon({
    className: "",
    html: `<div class="fb-marker ${active ? "fb-marker--active" : ""}"><img src="/monogram.svg" alt="Flo Barber" /></div>`,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -26],
  });
}

// Fond de carte vectoriel sombre (OpenFreeMap, sans clé API)
function VectorBasemap() {
  const map = useMap();
  useEffect(() => {
    const gl = L.maplibreGL({
      style: "https://tiles.openfreemap.org/styles/dark",
      attribution:
        '&copy; <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const glMap = typeof gl.getMaplibreMap === "function" ? gl.getMaplibreMap() : null;
    if (glMap) {
      // Certaines icônes de POI référencées par le style OpenFreeMap sont absentes
      // de son sprite. On leur fournit une image transparente pour éviter les
      // warnings "styleimagemissing" dans la console (aucun impact visuel).
      glMap.on("styleimagemissing", (e) => {
        if (e && e.id && !glMap.hasImage(e.id)) {
          glMap.addImage(e.id, { width: 1, height: 1, data: new Uint8Array(4) });
        }
      });
    }
    const id = setTimeout(() => {
      map.invalidateSize();
      if (glMap) glMap.resize();
    }, 300);

    return () => {
      clearTimeout(id);
      map.removeLayer(gl);
    };
  }, [map]);
  return null;
}

// Recentre la carte + ouvre la popup du salon actif
function MapController({ center, zoom, activeId, markerRefs }) {
  const map = useMap();

  useEffect(() => {
    if (!center) return;
    const targetZoom = zoom ?? map.getZoom();
    map.flyTo(center, targetZoom, { duration: 0.8 });

    // À la fin du déplacement, on ouvre la popup du pin actif ;
    // Leaflet ré-ajuste automatiquement la vue pour que la description soit visible.
    const openActivePopup = () => {
      const marker = activeId && markerRefs.current[activeId];
      if (marker) marker.openPopup();
      map.off("moveend", openActivePopup);
    };
    map.on("moveend", openActivePopup);
    return () => map.off("moveend", openActivePopup);
  }, [center, zoom, activeId, map, markerRefs]);

  return null;
}

export default function SalonMap({
  salons,
  activeId,
  center,
  zoom,
  onSelect,
}) {
  const t = useT();
  const initialCenter = center || [46.7, 2.5]; // centre de la France par défaut
  // Sur mobile, la vue France par défaut est dézoomée d'un cran (5 au lieu de 6)
  const isMobile =
    typeof window !== "undefined" && window.innerWidth <= 780;
  const initialZoom = center ? zoom ?? 12 : isMobile ? 5 : 6;
  const markerRefs = useRef({});

  return (
    <MapContainer
      center={initialCenter}
      zoom={initialZoom}
      scrollWheelZoom={true}
      className="salon-map-container"
    >
      <VectorBasemap />
      <MapController
        center={center}
        zoom={zoom}
        activeId={activeId}
        markerRefs={markerRefs}
      />

      {salons.map((s) => (
        <Marker
          key={s.id}
          position={[s.lat, s.lng]}
          icon={fbIcon(activeId === s.id)}
          ref={(el) => {
            if (el) markerRefs.current[s.id] = el;
          }}
          eventHandlers={{ click: () => onSelect && onSelect(s.id) }}
        >
          <Popup>
            <div className="salon-popup">
              <strong className="salon-popup-name">{s.name}</strong>
              <div className="salon-popup-info">
                {s.address}
                <br />
                {s.postalCode} {s.city}
                {s.phone ? (
                  <>
                    <br />
                    📞 {s.phone}
                  </>
                ) : null}
                {s.hours ? (
                  <>
                    <br />
                    🕒 {s.hours}
                  </>
                ) : null}
              </div>
              <a
                href={s.planityUrl || "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="salon-popup-btn"
              >
                {t("salonMap.book")}
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
