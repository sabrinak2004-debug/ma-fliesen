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
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
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