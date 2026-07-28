"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import salons from "@/data/salons";

// La carte Leaflet doit être chargée uniquement côté client (pas de SSR)
const SalonMap = dynamic(() => import("@/components/organisms/SalonMap"), {
  ssr: false,
  loading: () => <div className="map-loading">Chargement de la carte…</div>,
});

// Distance haversine (km)
function distanceKm(a, b) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export default function RecherchePage() {
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(null);
  const [center, setCenter] = useState(null);
  const [status, setStatus] = useState(null); // 'loading' | 'error' | null
  const [distances, setDistances] = useState({});
  const [placeholder, setPlaceholder] = useState(
    "Rechercher par code postal ou ville"
  );

  // Placeholder plus court sur mobile (manque de place)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 560px)");
    const update = () =>
      setPlaceholder(
        mq.matches
          ? "Ville ou code postal"
          : "Rechercher par code postal ou ville"
      );
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const orderedSalons = useMemo(() => {
    if (!Object.keys(distances).length) return salons;
    return [...salons].sort(
      (a, b) => (distances[a.id] ?? 1e9) - (distances[b.id] ?? 1e9)
    );
  }, [distances]);

  async function handleSearch(e) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setStatus("loading");
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
          new URLSearchParams({
            q: `${q}, France`,
            format: "json",
            limit: "1",
            countrycodes: "fr",
          }),
        { headers: { "Accept-Language": "fr" } }
      );
      const data = await res.json();
      if (!data.length) {
        showError();
        return;
      }
      const point = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };

      const d = {};
      salons.forEach((s) => {
        d[s.id] = distanceKm(point, s);
      });
      setDistances(d);

      const nearest = salons.reduce((best, s) =>
        d[s.id] < d[best.id] ? s : best
      );
      setActiveId(nearest.id);
      setCenter([nearest.lat, nearest.lng]);
      setStatus(null);
      // Sur mobile, on recentre la carte au milieu de l'écran (comme au clic sur un salon)
      if (typeof window !== "undefined" && window.innerWidth <= 1040) {
        setTimeout(() => {
          document
            .querySelector(".search-map")
            ?.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 60);
      }
    } catch (err) {
      showError();
    }
  }

  function showError() {
    setStatus("error");
    // Sur mobile, on met le message d'erreur en évidence
    if (typeof window !== "undefined" && window.innerWidth <= 1040) {
      setTimeout(() => {
        document
          .querySelector(".search-error")
          ?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 60);
    }
  }

  function selectSalon(id) {
    const s = salons.find((x) => x.id === id);
    if (!s) return;
    setActiveId(id);
    setCenter([s.lat, s.lng]);
    // Sur mobile/tablette la carte est au-dessus des cartes : on la recentre à l'écran
    if (typeof window !== "undefined" && window.innerWidth <= 1040) {
      document
        .querySelector(".search-map")
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function fmtDist(km) {
    if (km == null) return null;
    return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;
  }

  return (
    <div className="search">
      {/* HERO + recherche */}
      <section className="search-hero">
        <div className="container">
          <h1 className="search-hero-title">
            Trouver votre <span className="gold-text">Flo Barber</span>
          </h1>
          <div className="search-hero-sep">
            <span />
            Parmi nos {salons.length} salon{salons.length > 1 ? "s" : ""}
            <span />
          </div>

          <form onSubmit={handleSearch} className="search-bar">
            <svg
              className="search-bar-icon"
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <circle cx="11" cy="11" r="7" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label="Ville ou code postal"
            />
            <button
              type="submit"
              className="search-bar-submit"
              aria-label="Rechercher"
            >
              {status === "loading" ? (
                <svg
                  className="search-bar-spin"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M21 12a9 9 0 1 1-6.22-8.56" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <line x1="4" y1="12" x2="19" y2="12" />
                  <polyline points="13 6 19 12 13 18" />
                </svg>
              )}
            </button>
          </form>
          {status === "error" && (
            <p className="search-error">
              Adresse introuvable. Essayez une autre ville ou code postal.
            </p>
          )}
        </div>
      </section>

      {/* CARTE + RÉSULTATS */}
      <section className="container search-body">
        <div className="search-map">
          <SalonMap
            salons={salons}
            activeId={activeId}
            center={center}
            zoom={14}
            onSelect={selectSalon}
          />
        </div>

        <div className="search-results">
          <ul className="salon-cards">
            {orderedSalons.map((s) => (
              <li
                key={s.id}
                className={`salon-card ${activeId === s.id ? "active" : ""}`}
                role="button"
                tabIndex={0}
                aria-label={`Voir ${s.name} sur la carte`}
                onClick={() => selectSalon(s.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectSalon(s.id);
                  }
                }}
              >
                <div className="salon-card-media">
                  {s.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.image} alt={s.name} />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src="/monogram.svg"
                      alt=""
                      className="salon-card-ph"
                    />
                  )}
                  {distances[s.id] != null && (
                    <span className="salon-card-dist">
                      {fmtDist(distances[s.id])}
                    </span>
                  )}
                </div>

                <div className="salon-card-body">
                  <h3>{s.name}</h3>
                  <p className="salon-card-addr">
                    {s.address}
                    <br />
                    {s.postalCode} {s.city}
                  </p>
                  {s.hours && (
                    <p className="salon-card-hours">🕒 {s.hours}</p>
                  )}
                  <a
                    href={s.planityUrl || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="salon-card-btn"
                    onClick={(e) => e.stopPropagation()}
                  >
                    Réserver
                  </a>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
