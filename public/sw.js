/* Cache only this app's public shell. Calendar contents stay in IndexedDB. */
const CACHE = "luke-shell-2026-11-04-v4";
self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await cache.addAll([
        "/offline.html",
        "/icons/icon-192.png",
        "/icons/icon-512.png",
      ]);
      try {
        const response = await fetch("/calendars", { cache: "reload" });
        if (response.ok) {
          await cache.put("/calendars", response.clone());
          const html = await response.text();
          const assets = [
            ...new Set(
              [
                ...html.matchAll(
                  /(?:src|href)="(\/_next\/static\/[^"?#]+)[^"]*"/g,
                ),
              ].map((match) => match[1]),
            ),
          ];
          await Promise.allSettled(assets.map((asset) => cache.add(asset)));
        }
      } catch {
        /* Offline fallback still installs if the shell is temporarily unavailable. */
      }
      await self.skipWaiting();
    })(),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all(
        (await caches.keys())
          .filter((key) => key.startsWith("luke-shell-") && key !== CACHE)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    url.searchParams.has("_rsc") ||
    request.headers.has("RSC")
  )
    return;
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        try {
          const response = await fetch(request);
          if (
            response.ok &&
            response.headers.get("Content-Type")?.includes("text/html")
          )
            await cache.put(url.pathname, response.clone());
          return response;
        } catch {
          return (
            (await cache.match(url.pathname)) ||
            (await cache.match("/offline.html"))
          );
        }
      })(),
    );
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/fonts.css"
  ) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response.ok) await cache.put(request, response.clone());
        return response;
      })(),
    );
  }
});
