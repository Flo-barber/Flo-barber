// Service worker minimal — rend l'application installable (PWA)
// et fournit un cache basique pour l'App Shell.
const CACHE = "flo-barber-v1";
const APP_SHELL = ["/", "/recherche", "/catalogue"];

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
  // On ne gère que les GET même origine ; le reste passe au réseau.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) {
    return;
  }
  // Réseau d'abord, repli sur le cache hors-ligne.
  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE).then((cache) => cache.put(request, copy).catch(() => {}));
        return response;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/")))
  );
});
