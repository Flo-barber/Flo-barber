// Service worker — rend l'application installable (PWA) et fournit un cache
// basique de l'App Shell (stratégie « réseau d'abord », repli cache hors-ligne).
//
// ⚠️ Bumper CACHE ("...-vN") à chaque changement de stratégie : l'ancien cache
//    est purgé automatiquement à l'activation du nouveau service worker.
const CACHE = "flo-barber-v2";

// URLs RÉELLEMENT servies (avec préfixe de locale) : "/" et "/recherche"
// redirigent vers "/fr/...", et cache.addAll échoue sur une redirection.
const APP_SHELL = ["/fr", "/fr/recherche", "/fr/catalogue", "/fr/boutique"];

// Page de repli hors-ligne (doit faire partie de l'App Shell ci-dessus).
const OFFLINE_FALLBACK = "/fr";

// Pages authentifiées / dynamiques : JAMAIS mises en cache (confidentialité).
// Couvre /compte, /admin, /api avec ou sans préfixe de locale.
const SENSITIVE = /^\/(?:[a-z]{2}\/)?(?:compte|admin|api)(?:\/|$)/;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
      )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // On ne gère que les GET même origine ; le reste passe au réseau.
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // Pages sensibles/dynamiques : réseau uniquement, sans mise en cache.
  // Repli sur l'App Shell si hors-ligne.
  if (SENSITIVE.test(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_FALLBACK)));
    return;
  }

  // Réseau d'abord ; on met en cache uniquement les réponses valides
  // (200 OK, non redirigées) ; repli sur le cache puis l'App Shell hors-ligne.
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && !response.redirected) {
          const copy = response.clone();
          caches
            .open(CACHE)
            .then((cache) => cache.put(request, copy).catch(() => {}));
        }
        return response;
      })
      .catch(() =>
        caches.match(request).then((r) => r || caches.match(OFFLINE_FALLBACK))
      )
  );
});
