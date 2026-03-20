const STATIC_CACHE_NAME = "ma-fliesen-static-v2";
const RUNTIME_CACHE_NAME = "ma-fliesen-runtime-v2";

const STATIC_ASSETS = [
  "/manifest.json",
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME).then(function (cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );

  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches
      .keys()
      .then(function (cacheNames) {
        return Promise.all(
          cacheNames.map(function (cacheName) {
            const isOldStaticCache =
              cacheName.startsWith("ma-fliesen-static-") &&
              cacheName !== STATIC_CACHE_NAME;

            const isOldRuntimeCache =
              cacheName.startsWith("ma-fliesen-runtime-") &&
              cacheName !== RUNTIME_CACHE_NAME;

            if (isOldStaticCache || isOldRuntimeCache) {
              return caches.delete(cacheName);
            }

            return Promise.resolve(false);
          })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (event) {
  const request = event.request;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) {
    return;
  }

  if (url.pathname.startsWith("/api/")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then(function (networkResponse) {
          if (
            networkResponse &&
            networkResponse.status === 200 &&
            !networkResponse.redirected
          ) {
            const responseToCache = networkResponse.clone();
            caches.open(RUNTIME_CACHE_NAME).then(function (cache) {
              cache.put(request, responseToCache);
            });
          }

          return networkResponse;
        })
        .catch(async function () {
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }

          const cachedRoot = await caches.match("/");
          if (cachedRoot) {
            return cachedRoot;
          }

          return new Response("Offline", {
            status: 503,
            statusText: "Offline",
            headers: {
              "Content-Type": "text/plain; charset=utf-8",
            },
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (cachedResponse) {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then(function (networkResponse) {
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.redirected
          ) {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();

          return caches.open(RUNTIME_CACHE_NAME).then(function (cache) {
            cache.put(request, responseToCache);
            return networkResponse;
          });
        })
        .catch(function () {
          return new Response("", {
            status: 504,
            statusText: "Offline cache miss",
          });
        });
    })
  );
});

self.addEventListener("push", function (event) {
  let data = {
    title: "Mitarbeiterportal",
    body: "Neue Benachrichtigung",
    url: "/",
    icon: "/image_2.jpeg",
    badge: "/image_2.jpeg",
  };

  try {
    if (event.data) {
      const parsed = event.data.json();

      const companySubdomain =
        typeof parsed.companySubdomain === "string"
          ? parsed.companySubdomain.trim().toLowerCase()
          : "";

      const defaultTenantIcon = companySubdomain
        ? `/tenant-assets/${companySubdomain}/icon-192.jpeg`
        : "/image_2.jpeg";

      const defaultTenantBadge = companySubdomain
        ? `/tenant-assets/${companySubdomain}/apple-touch-icon.png`
        : "/image_2.jpeg";

      data = {
        title:
          typeof parsed.title === "string"
            ? parsed.title
            : "Mitarbeiterportal",
        body:
          typeof parsed.body === "string"
            ? parsed.body
            : "Neue Benachrichtigung",
        url: typeof parsed.url === "string" ? parsed.url : "/",
        icon:
          typeof parsed.icon === "string"
            ? parsed.icon
            : defaultTenantIcon,
        badge:
          typeof parsed.badge === "string"
            ? parsed.badge
            : defaultTenantBadge,
      };
    }
  } catch (err) {
    console.error("Push payload konnte nicht gelesen werden:", err);
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon,
      badge: data.badge,
      data: {
        url: data.url || "/",
      },
    })
  );
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();

  const targetUrl =
    event.notification &&
    event.notification.data &&
    typeof event.notification.data.url === "string"
      ? event.notification.data.url
      : "/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (clientList) {
      for (const client of clientList) {
        if ("focus" in client) {
          if ("navigate" in client) {
            client.navigate(targetUrl);
          }
          return client.focus();
        }
      }

      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }

      return Promise.resolve();
    })
  );
});