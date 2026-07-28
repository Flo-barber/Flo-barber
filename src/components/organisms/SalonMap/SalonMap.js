"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./SalonMap.scss"; // après leaflet.css : nos overrides priment par cascade

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
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />
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
                Réserver sur Planity
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
