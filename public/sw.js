// Minimaler Service Worker: macht die App installierbar. Bewusst KEIN Caching,
// damit Fristen und Verträge immer aktuell vom Server kommen.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {});
